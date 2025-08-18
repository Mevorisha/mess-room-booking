import { FirebaseFirestore, FirestorePaths } from "@/firebase/init";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  ApiResponseUrlType,
  AutoSetFields,
  RoomGetResBodyNotOwnerDTO,
  RoomGetResBodyOwnerDTO,
  RoomPostReqBodyOmitFilesDTO,
} from "sharedtypes";
import { CustomApiError } from "@/types/CustomApiError";
import Booking from "@/models/Booking";
import pickObjProps from "@/utils/pickObjProps";
import { DateTransformer } from "@/dataTransformers/DateTransformer";
import { RoomTransformer } from "@/services/Room/RoomTransformer";
import { RoomModel, RoomReadOnlyFields } from "@/models/Room";
import { QueryWrapper } from "@/types/QueryWrapper";

export class RoomRepo {
  /**
   * Create a new room document
   */
  static async create(roomData: RoomPostReqBodyOmitFilesDTO): Promise<string> {
    const ref = FirebaseFirestore.collection(FirestorePaths.ROOMS);

    const querySnapshot = await QueryWrapper.create<RoomModel>(ref)
      .where("ownerId", "==", roomData.ownerId)
      .where("acceptGender", "==", roomData.acceptGender)
      .where("acceptOccupation", "==", roomData.acceptOccupation)
      .where("landmark", "==", roomData.landmark)
      .where("address", "==", roomData.address)
      .where("city", "==", roomData.city)
      .where("state", "==", roomData.state)
      .where("capacity", "==", roomData.capacity)
      .where("pricePerOccupant", "==", roomData.pricePerOccupant)
      .getQuery()
      .get();

    if (!querySnapshot.empty) {
      throw CustomApiError.create(409, "Similar room already exists");
    }

    // for safety, ensure only the acceptable fields are present
    roomData = pickObjProps(roomData, [
      "ownerId",
      "acceptGender",
      "acceptOccupation",
      "searchTags",
      "landmark",
      "address",
      "city",
      "state",
      "majorTags",
      "minorTags",
      "capacity",
      "pricePerOccupant",
    ]);

    // remove duplicate tags
    roomData.searchTags = Array.from(new Set(roomData.searchTags));
    roomData.majorTags = Array.from(new Set(roomData.majorTags));
    roomData.minorTags = Array.from(new Set(roomData.minorTags));

    const docRef = ref.doc();
    const createData: RoomModel = {
      // room data from controller
      ...roomData,
      // intialise
      id: docRef.id,
      rating: 0,
      isUnavailable: false,
      // Add auto fields (cast as Timestamp for typesafety)
      createdOn: FieldValue.serverTimestamp() as unknown as Timestamp,
      lastModifiedOn: FieldValue.serverTimestamp() as unknown as Timestamp,
    };

    await docRef.set(createData);
    return docRef.id;
  }

  /**
   * Update an existing room document
   */
  static async update(
    roomId: string,
    updateData: Partial<Omit<RoomModel, AutoSetFields | RoomReadOnlyFields | "isUnavailable">>
  ): Promise<void> {
    // for safety, ensure only the acceptable fields are present
    updateData = pickObjProps(updateData, [
      "images",
      "rating",
      "acceptOccupation",
      "searchTags",
      "landmark",
      "address",
      "city",
      "state",
      "majorTags",
      "minorTags",
      "capacity",
      "pricePerOccupant",
    ]);

    const ref = FirestorePaths.Rooms(roomId);

    try {
      // Throws error if room doesn't exist
      await ref.update({ ...updateData, lastModifiedOn: FieldValue.serverTimestamp() });
    } catch (e) {
      throw CustomApiError.create(404, "Room not found", e);
    }
  }

  static async markForDelete(roomId: string): Promise<number> {
    if (await RoomRepo.hasBooking(roomId)) {
      throw CustomApiError.create(409, "Room is in use");
    }
    const daysToLive = 30;
    const ref = FirestorePaths.Rooms(roomId);
    const ttl = Timestamp.fromDate(new Date(Date.now() + daysToLive * 24 * 60 * 60 * 1000));
    try {
      // Throws error if room doesn't exist
      await ref.update({ ttl, lastModifiedOn: FieldValue.serverTimestamp() });
    } catch (e) {
      throw CustomApiError.create(404, "Room not found", e);
    }
    return daysToLive;
  }

  static async unmarkForDelete(roomId: string): Promise<void> {
    const ref = FirestorePaths.Rooms(roomId);
    try {
      // Throws error if room doesn't exist
      await ref.update({ ttl: FieldValue.delete(), lastModifiedOn: FieldValue.serverTimestamp() });
    } catch (e) {
      throw CustomApiError.create(404, "Room not found", e);
    }
  }

  static async forceDelete(roomId: string): Promise<void> {
    if (await RoomRepo.hasBooking(roomId)) {
      throw CustomApiError.create(409, "Room is in use");
    }
    const ref = FirestorePaths.Rooms(roomId);
    try {
      // Throws error if room doesn't exist
      await ref.delete();
    } catch (e) {
      throw CustomApiError.create(404, "Room not found", e);
    }
  }

  static async setUnavailability(roomId: string, isUnavailable: boolean): Promise<void> {
    if (await RoomRepo.hasBooking(roomId)) {
      throw CustomApiError.create(409, "Room is in use");
    }
    const ref = FirestorePaths.Rooms(roomId);
    try {
      // Throws error if room doesn't exist
      await ref.update({ isUnavailable, lastModifiedOn: FieldValue.serverTimestamp() });
    } catch (e) {
      throw CustomApiError.create(404, "Room not found", e);
    }
  }

  /**
   * Check if a room has any active bookings
   * @param roomId The ID of the room to check
   * @returns Promise<boolean> True if the room has any active bookings
   */
  static async hasBooking(roomId: string): Promise<boolean> {
    // Query for bookings with this roomId that are not cancelled and not cleared
    const bookings = await Booking.queryAll({ queryIdType: "ROOM", id: roomId });

    // If we found any bookings, the room has active bookings
    return bookings.filter((b) => !(b.isCancelled ?? false) && !(b.isCleared ?? false)).length > 0;
  }

  static async findById(
    uid: string,
    extUrls: ApiResponseUrlType,
    options?: { isOwner?: false }
  ): Promise<RoomGetResBodyNotOwnerDTO | null>;

  static async findById(
    uid: string,
    extUrls: ApiResponseUrlType,
    options: { isOwner: true }
  ): Promise<RoomGetResBodyOwnerDTO | null>;

  /**
   * Get specific fields from a room document
   */
  static async findById(
    roomId: string,
    extUrls: ApiResponseUrlType,
    options?: { isOwner?: boolean }
  ): Promise<RoomGetResBodyNotOwnerDTO | RoomGetResBodyOwnerDTO | null> {
    const ref = FirestorePaths.Rooms(roomId);

    const doc = await ref.get();
    if (!doc.exists) {
      return null;
    }

    let data = doc.data() as RoomModel | null;
    if (data == null) {
      return null;
    }

    if (extUrls === ApiResponseUrlType.API_URI) {
      data = RoomTransformer.imgConvertGsPathToApiUri(data, roomId);
    }

    // convert timestamps to strings
    const dateTransformed = DateTransformer.transform(data);

    if (options?.isOwner == null || options.isOwner === false) {
      const jsonResult = RoomGetResBodyNotOwnerDTO.fromJson(dateTransformed);
      if (jsonResult.isErr) {
        throw CustomApiError.create(500, "Validation failure", jsonResult.error);
      }
      return jsonResult.value;
    } else {
      const jsonResult = RoomGetResBodyOwnerDTO.fromJson(dateTransformed);
      if (jsonResult.isErr) {
        throw CustomApiError.create(500, "Validation failure", jsonResult.error);
      }
      return jsonResult.value;
    }
  }
}
