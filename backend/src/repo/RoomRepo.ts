import { FirebaseFirestore, FirestorePaths } from "@/firebase/init";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  ApiResponseUrlType,
  AutoSetFields,
  MultipleErrors,
  MultiSizePhotoDTO,
  RoomGetResBodyNotOwnerDTO,
  RoomGetResBodyOwnerDTO,
  RoomPostReqBodyDTO,
} from "sharedtypes";
import { CustomApiError } from "@/types/CustomApiError";
import pickObjProps from "@/utils/pickObjProps";
import { DateTransformer } from "@/dataTransformers/DateTransformer";
import { RoomTransformer } from "@/services/Room/RoomTransformer";
import { RoomModel, RoomReadOnlyFields } from "@/models/Room";
import { QueryWrapper } from "@/types/QueryWrapper";
import { MultiSizePhotoModel } from "@/models/types";

export class RoomRepo {
  /**
   * Create a new room document
   */
  static async create(dto: RoomPostReqBodyDTO.OmitFiles): Promise<string> {
    const ref = FirebaseFirestore.collection(FirestorePaths.ROOMS);

    if (dto.ownerId == null) {
      throw CustomApiError.create(500, "Internal Server Error", "Missing Owner UID");
    }

    const querySnapshot = await QueryWrapper.create<RoomModel>(ref)
      .where("ownerId", "==", dto.ownerId)
      .where("acceptGender", "==", dto.acceptGender)
      .where("acceptOccupation", "==", dto.acceptOccupation)
      .where("landmark", "==", dto.landmark)
      .where("address", "==", dto.address)
      .where("city", "==", dto.city)
      .where("state", "==", dto.state)
      .where("capacity", "==", dto.capacity)
      .where("pricePerOccupant", "==", dto.pricePerOccupant)
      .getQuery()
      .get();

    if (!querySnapshot.empty) {
      throw CustomApiError.create(409, "Similar room already exists");
    }

    // for safety, ensure only the acceptable fields are present
    const roomData = pickObjProps(dto, [
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
    if (roomData.minorTags != null) {
      roomData.minorTags = Array.from(new Set(roomData.minorTags));
    }

    if (roomData.ownerId == null) {
      throw CustomApiError.create(500, "Internal Server Error", "Missing Owner UID");
    }

    const docRef = ref.doc();
    const createData: RoomModel = {
      // room data from controller
      ownerId: roomData.ownerId,
      ...roomData,
      // intialise
      id: docRef.id,
      rating: 0,
      isUnavailable: false,
      // Add auto fields (cast as Timestamp for typesafety)
      createdOn: FieldValue.serverTimestamp() as unknown as Timestamp,
      lastModifiedOn: FieldValue.serverTimestamp() as unknown as Timestamp,
    };

    await docRef.set(createData, { merge: true });
    return docRef.id;
  }

  /**
   * Update an existing room document
   */
  static async update(
    roomId: string,
    updateData: Partial<Omit<RoomModel, AutoSetFields | RoomReadOnlyFields | "isUnavailable">>
  ): Promise<void> {
    const docRef = FirestorePaths.Rooms(roomId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      CustomApiError.create(404, "Room not found");
    }

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

    // remove duplicate tags
    if (updateData.searchTags != null) {
      updateData.searchTags = Array.from(new Set(updateData.searchTags));
    }
    if (updateData.majorTags != null) {
      updateData.majorTags = Array.from(new Set(updateData.majorTags));
    }
    if (updateData.minorTags != null) {
      updateData.minorTags = Array.from(new Set(updateData.minorTags));
    }
    // convert any DTOs into json
    if (updateData.images != null) {
      const imagesResults = updateData.images.map((img) => MultiSizePhotoDTO.create(img));
      const errors = imagesResults.filter((result) => result.isErr).map((result) => result.error);
      const photoDTOs = imagesResults.filter((result) => result.isOk).map((result) => result.value);
      if (errors.length > 0) {
        if (photoDTOs.length === 0) {
          throw CustomApiError.create(500, "Internal Server Error", errors);
        } else {
          console.error("[E] [RoomRepo] some 'MultiSizePhotoDTO' conversions failed");
          console.error(new MultipleErrors(errors));
        }
      }
      updateData.images = photoDTOs.map((dto) => dto.toJSON() as MultiSizePhotoModel);
    }

    /* Uses set with merge true instead of update as updateData has nested objects */
    await docRef.set({ ...updateData, lastModifiedOn: FieldValue.serverTimestamp() }, { merge: true });
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
        throw CustomApiError.create(500, "Internal Server Error", jsonResult.error);
      }
      return jsonResult.value;
    } else {
      const jsonResult = RoomGetResBodyOwnerDTO.fromJson(dateTransformed);
      if (jsonResult.isErr) {
        throw CustomApiError.create(500, "Internal Server Error", jsonResult.error);
      }
      return jsonResult.value;
    }
  }
}
