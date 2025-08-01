import { FirebaseFirestore, FirestorePaths, StoragePaths } from "@/firebase/init";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { AcceptGender, AcceptOccupation, ApiResponseUrlType, AutoSetFields, MultiSizePhoto } from "./types";
import { CustomApiError } from "@/types/CustomApiError";
import Booking from "./Booking";
import pickObjProps from "@/utils/pickObjProps";

export interface RoomData {
  ownerId: string;
  acceptGender: AcceptGender;
  acceptOccupation: AcceptOccupation;
  searchTags: string[];
  landmark: string;
  address: string;
  city: string;
  state: string;
  majorTags: string[];
  minorTags: string[];
  capacity: number;
  pricePerOccupant: number;
  // Set later on
  images?: Array<MultiSizePhoto>;
  isUnavailable?: boolean;
  // 0 to 5
  rating: number;
  // AutoSetFields
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}

// During create, apart from AutoSetFields, isUnavailable MUST not be set
export type RoomCreateData = Omit<RoomData, AutoSetFields | "images" | "rating" | "isUnavailable">;

// During update, apart from AutoSetFields, ownerId & acceptGender may not be changed
export type RoomUpdateData = Partial<Omit<RoomData, AutoSetFields | "isUnavailable" | "ownerId" | "acceptGender">>;

// During read, all data may be read
export interface RoomDTO {
  id: string;
  // fields from backend/src/models/Room.ts
  ownerId: string;
  acceptGender: AcceptGender;
  acceptOccupation: AcceptOccupation;
  searchTags: string[];
  landmark: string;
  address: string;
  city: string;
  state: string;
  majorTags: string[];
  minorTags: string[];
  capacity: number;
  pricePerOccupant: number;
  images: MultiSizePhoto[];
  rating: number;
  createdOn: string;
  lastModifiedOn: string;
  // shown only to room owner
  isUnavailable?: boolean;
  ttl?: string | null;
  isDeleted?: boolean;
}

// Params to query a room by
export type RoomQueryParams = Partial<{
  self?: boolean;
  ownerId: string;
  acceptGender: AcceptGender;
  acceptOccupation: AcceptOccupation;
  landmark: string;
  city: string;
  state: string;
  capacity: number;
  lowPrice: number;
  highPrice: number;
  searchTags: Set<string>;
  // probably not used
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
}>;

export enum SchemaFields {
  OWNER_ID = "ownerId",
  ACCEPT_GENDER = "acceptGender",
  ACCEPT_OCCUPATION = "acceptOccupation",
  SEARCH_TAGS = "searchTags",
  LANDMARK = "landmark",
  ADDRESS = "address",
  CITY = "city",
  STATE = "state",
  MAJOR_TAGS = "majorTags",
  MINOR_TAGS = "minorTags",
  IMAGES = "images",
  CAPACITY = "capacity",
  PRICE_PER_OCCUPANT = "pricePerOccupant",
  IS_UNAVAILABLE = "isUnavailable",
  RATING = "rating",
  CREATED_ON = "createdOn",
  LAST_MODIFIED_ON = "lastModifiedOn",
  TTL = "ttl",
}

export enum PseudoFields {
  ID = "id",
  IS_DELETED = "isDeleted",
}

function fbDataToQueryableRoomData(data: FirebaseFirestore.DocumentData): RoomData {
  let _data = { ...data };
  _data["searchTags"] = (_data["searchTags"] || []).map((tag: string) => tag.toLowerCase());
  _data["majorTags"] = (_data["majorTags"] || []).map((tag: string) => tag.toLowerCase());
  _data["minorTags"] = (_data["minorTags"] || []).map((tag: string) => tag.toLowerCase());
  _data["landmark"] = _data["landmark"]?.toLowerCase();
  _data["city"] = _data["city"]?.toLowerCase();
  _data["state"] = _data["state"]?.toLowerCase();
  _data["address"] = _data["address"]?.toLowerCase();
  _data["images"] = _data["images"]?.map((img: MultiSizePhoto) => ({
    small: img.small,
    medium: img.medium,
    large: img.large,
  }));
  return _data as RoomData;
}

function imgConvertGsPathToApiUri<T extends { images?: MultiSizePhoto[] }>(dataToBeUpdated: T, roomId: string) {
  if (dataToBeUpdated.images != null) {
    // prettier-ignore
    dataToBeUpdated.images = dataToBeUpdated.images.map((imgGsPaths: MultiSizePhoto) => ({
      small: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.small), "small"),
      medium: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.medium), "medium"),
      large: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.large), "large"),
    }));
  }
  return dataToBeUpdated;
}

class Room {
  /**
   * Create a new room document
   */
  static async create(roomData: RoomCreateData): Promise<string> {
    // for safety, ensure only the acceptable fields are present
    roomData = pickObjProps(roomData, [
      SchemaFields.OWNER_ID,
      SchemaFields.ACCEPT_GENDER,
      SchemaFields.ACCEPT_OCCUPATION,
      SchemaFields.SEARCH_TAGS,
      SchemaFields.LANDMARK,
      SchemaFields.ADDRESS,
      SchemaFields.CITY,
      SchemaFields.STATE,
      SchemaFields.MAJOR_TAGS,
      SchemaFields.MINOR_TAGS,
      SchemaFields.CAPACITY,
      SchemaFields.PRICE_PER_OCCUPANT,
    ]) as RoomCreateData;

    const ref = FirebaseFirestore.collection(FirestorePaths.ROOMS);

    const querySnapshot = await FirebaseFirestore.collection(FirestorePaths.ROOMS)
      .where(SchemaFields.OWNER_ID, "==", roomData.ownerId)
      .where(SchemaFields.ADDRESS, "==", roomData.address)
      .where(SchemaFields.CITY, "==", roomData.city)
      .where(SchemaFields.STATE, "==", roomData.state)
      .where(SchemaFields.CAPACITY, "==", roomData.capacity)
      .where(SchemaFields.PRICE_PER_OCCUPANT, "==", roomData.pricePerOccupant)
      .get();

    if (!querySnapshot.empty) {
      throw CustomApiError.create(409, "Room w/ same address, price and capacity already exists");
    }

    const createData = {
      ...roomData,
      // Convert sets to array
      searchTags: Array.from(roomData.searchTags ?? []),
      majorTags: Array.from(roomData.majorTags ?? []),
      minorTags: Array.from(roomData.minorTags ?? []),
      // Intialise
      rating: 0,
      isUnavailable: false,
      // Add auto fields
      createdOn: FieldValue.serverTimestamp(),
      lastModifiedOn: FieldValue.serverTimestamp(),
    };

    const docRef = await ref.add(createData);
    return docRef.id;
  }

  /**
   * Update an existing room document
   */
  static async update(roomId: string, updateData: RoomUpdateData): Promise<void> {
    // for safety, ensure only the acceptable fields are present
    updateData = pickObjProps(updateData, [
      SchemaFields.IMAGES,
      SchemaFields.RATING,
      SchemaFields.ACCEPT_OCCUPATION,
      SchemaFields.SEARCH_TAGS,
      SchemaFields.LANDMARK,
      SchemaFields.ADDRESS,
      SchemaFields.CITY,
      SchemaFields.STATE,
      SchemaFields.MAJOR_TAGS,
      SchemaFields.MINOR_TAGS,
      SchemaFields.CAPACITY,
      SchemaFields.PRICE_PER_OCCUPANT,
    ]) as RoomUpdateData;

    const ref = FirestorePaths.Rooms(roomId);

    const updateDataFrstrFormat: Record<string, any> = {
      ...updateData,
      lastModifiedOn: FieldValue.serverTimestamp(),
    };

    // Convert sets to array
    // Make sure u update the array type fields only if they exist in given data
    if (updateDataFrstrFormat["searchTags"]) updateDataFrstrFormat["searchTags"] = Array.from(updateData.searchTags ?? []); // prettier-ignore
    if (updateDataFrstrFormat["majorTags"]) updateDataFrstrFormat["majorTags"] = Array.from(updateData.majorTags ?? []);
    if (updateDataFrstrFormat["minorTags"]) updateDataFrstrFormat["minorTags"] = Array.from(updateData.minorTags ?? []);

    try {
      // Throws error if room doesn't exist
      await ref.update(updateDataFrstrFormat);
    } catch (e) {
      throw CustomApiError.create(404, "Room not found");
    }
  }

  static async markForDelete(roomId: string): Promise<number> {
    if (await Room.hasBooking(roomId)) {
      throw CustomApiError.create(409, "Room is in use");
    }
    const daysToLive = 30;
    const ref = FirestorePaths.Rooms(roomId);
    const ttl = Timestamp.fromDate(new Date(Date.now() + daysToLive * 24 * 60 * 60 * 1000));
    try {
      // Throws error if room doesn't exist
      await ref.update({ ttl, lastModifiedOn: FieldValue.serverTimestamp() });
    } catch (e) {
      throw CustomApiError.create(404, "Room not found");
    }
    return daysToLive;
  }

  static async unmarkForDelete(roomId: string): Promise<void> {
    const ref = FirestorePaths.Rooms(roomId);
    try {
      // Throws error if room doesn't exist
      await ref.update({ ttl: FieldValue.delete(), lastModifiedOn: FieldValue.serverTimestamp() });
    } catch (e) {
      throw CustomApiError.create(404, "Room not found");
    }
  }

  static async forceDelete(roomId: string) {
    if (await Room.hasBooking(roomId)) {
      throw CustomApiError.create(409, "Room is in use");
    }
    const ref = FirestorePaths.Rooms(roomId);
    try {
      // Throws error if room doesn't exist
      await ref.delete();
    } catch (e) {
      throw CustomApiError.create(404, "Room not found");
    }
  }

  static async setUnavailability(roomId: string, isUnavailable: boolean) {
    if (await Room.hasBooking(roomId)) {
      throw CustomApiError.create(409, "Room is in use");
    }
    const ref = FirestorePaths.Rooms(roomId);
    try {
      // Throws error if room doesn't exist
      await ref.update({ isUnavailable, lastModifiedOn: FieldValue.serverTimestamp() });
    } catch (e) {
      throw CustomApiError.create(404, "Room not found");
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
    return bookings.filter((b) => !b.isCancelled && !b.isCleared).length > 0;
  }

  /**
   * Get specific fields from a room document
   */
  static async get(
    roomId: string,
    extUrls: ApiResponseUrlType,
    fields: (SchemaFields | PseudoFields)[] = []
  ): Promise<Partial<RoomDTO> | null> {
    const ref = FirestorePaths.Rooms(roomId);

    const doc = await ref.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) {
      return null;
    }

    // add pseudo fields
    if (fields.length === 0 || fields.includes(PseudoFields.ID)) {
      data["id"] = roomId;
    }
    if (fields.length === 0 || fields.includes(PseudoFields.IS_DELETED)) {
      if (data["ttl"] != null) data["isDeleted"] = true;
      else data["isDeleted"] = false;
    }
    if (fields.length === 0 || fields.includes(SchemaFields.RATING)) {
      // Set default rating if null
      if (data["rating"] == null) data["rating"] = 0;
    }

    // convert timestamps to strings
    Room.convertTimestamps(data);

    // If no fields provided, send all params
    if (fields.length === 0) {
      // convert image paths to direct urls
      if (extUrls === "API_URI") {
        return imgConvertGsPathToApiUri(data, roomId);
      } else {
        return data;
      }
    }

    // Filter params
    const result = {} as Partial<RoomDTO>;
    for (const field of fields) {
      (result as any)[field] = data[field] ?? null;
    }

    // convert image paths to api uri if any
    if (extUrls === "API_URI") {
      return imgConvertGsPathToApiUri(result, roomId);
    } else {
      return result;
    }
  }

  static async queryAll(
    params: RoomQueryParams,
    extUrls: ApiResponseUrlType,
    sortOn?: "capacity" | "rating" | "pricePerOccupant",
    sortOrder?: "asc" | "desc",
    fields: (SchemaFields | PseudoFields)[] = []
  ): Promise<Partial<RoomDTO>[]> {
    // 1. QUERY - Build and execute Firestore query
    const query = Room.buildFirestoreQuery(params, sortOn, sortOrder);
    const snapshot = await query.get();
    // 2. SORT ORDER - Apply tag-based filtering and initial sorting
    const filteredRooms = Room.filterAndSortByTags(snapshot.docs, params);
    // 3. FILTER OUT PROPS - Convert RoomData to RoomDTO with field filtering
    // 4. ADD PSEUDO PROPS - Handled in convertToRoomDTOs
    const roomDTOs = Room.convertToRoomDTOs(filteredRooms, fields);
    // 5. CONVERT IMAGE LINKS - Transform image paths to API URIs if needed
    const roomsWithImages = Room.convertImageLinks(roomDTOs, extUrls);
    // 6. SORT THE RESULT - Apply final sorting logic
    const sortedResults = Room.applySorting(roomsWithImages, params, sortOn);
    // 7. RETURN
    return sortedResults;
  }

  // ----------------------------------------------- PRIVATE HELPER FUNCTIONS ----------------------------------------------------

  // Helper function to build Firestore query
  private static buildFirestoreQuery(
    params: RoomQueryParams,
    sortOn?: "capacity" | "rating" | "pricePerOccupant",
    sortOrder?: "asc" | "desc"
  ) {
    const ref = FirebaseFirestore.collection(FirestorePaths.ROOMS);
    let query: any = ref;

    // Apply filters for exact matches
    if (params.ownerId) {
      query = query.where(SchemaFields.OWNER_ID, "==", params.ownerId);
    }
    if (params.acceptGender) {
      query = query.where(SchemaFields.ACCEPT_GENDER, "==", params.acceptGender);
    }
    if (params.acceptOccupation) {
      query = query.where(SchemaFields.ACCEPT_OCCUPATION, "==", params.acceptOccupation);
    }
    if (params.landmark) {
      query = query.where(SchemaFields.LANDMARK, "==", params.landmark);
    }
    if (params.city) {
      query = query.where(SchemaFields.CITY, "==", params.city);
    }
    if (params.state) {
      query = query.where(SchemaFields.STATE, "==", params.state);
    }
    if (params.capacity) {
      query = query.where(SchemaFields.CAPACITY, ">=", params.capacity);
    }
    if (params.lowPrice) {
      query = query.where(SchemaFields.PRICE_PER_OCCUPANT, ">=", params.lowPrice);
    }
    if (params.highPrice) {
      query = query.where(SchemaFields.PRICE_PER_OCCUPANT, "<=", params.highPrice);
    }
    if (params.createdOn) {
      query = query.where(SchemaFields.CREATED_ON, ">=", params.createdOn);
    }
    if (params.lastModifiedOn) {
      query = query.where(SchemaFields.LAST_MODIFIED_ON, ">=", params.lastModifiedOn);
    }

    // Only available rooms
    query = query.where(SchemaFields.IS_UNAVAILABLE, "==", false);

    // Apply server-side sorting
    if (sortOn) {
      const fieldToSort = Room.getFieldToSort(sortOn);
      if (fieldToSort) {
        const direction = sortOrder === "desc" ? "desc" : "asc";
        query = query.orderBy(fieldToSort, direction);
      }
    } else {
      // Default sorting by lastModifiedOn
      query = query.orderBy(SchemaFields.LAST_MODIFIED_ON, "desc");
    }

    return query;
  }

  // Helper function to get the field to sort by
  private static getFieldToSort(sortOn: "capacity" | "rating" | "pricePerOccupant"): SchemaFields | null {
    switch (sortOn) {
      case "pricePerOccupant":
        return SchemaFields.PRICE_PER_OCCUPANT;
      case "capacity":
        return SchemaFields.CAPACITY;
      case "rating":
        return SchemaFields.RATING;
      default:
        return null;
    }
  }

  // Helper function to filter by tags and apply tag-based sorting
  private static filterAndSortByTags(
    docs: FirebaseFirestore.QueryDocumentSnapshot[],
    params: RoomQueryParams
  ): { data: RoomData; sortPriority: number; docId: string }[] {
    const results: { data: RoomData; sortPriority: number; docId: string }[] = [];

    for (const doc of docs) {
      const roomData = doc.data() as RoomData;

      // Apply tag filtering if searchTags are provided
      if (params.searchTags && params.searchTags.size > 0) {
        const tagResult = Room.getTagMatchPriority(roomData, params.searchTags);
        if (!tagResult.hasMatch) continue;

        results.push({
          data: roomData,
          sortPriority: tagResult.priority,
          docId: doc.id,
        });
      } else {
        results.push({
          data: roomData,
          sortPriority: 0,
          docId: doc.id,
        });
      }
    }

    return results;
  }

  // Helper function to check tag matches and return priority
  private static getTagMatchPriority(
    roomData: RoomData,
    searchTags: Set<string>
  ): { hasMatch: boolean; priority: number } {
    const queryableRoomData = fbDataToQueryableRoomData({ data: roomData, sortPriority: 0 });

    for (let tag of searchTags) {
      tag = tag.toLowerCase();

      if (queryableRoomData.landmark?.includes(tag)) {
        return { hasMatch: true, priority: 1 };
      } else if (queryableRoomData.city?.includes(tag)) {
        return { hasMatch: true, priority: 2 };
      } else if (queryableRoomData.state?.includes(tag)) {
        return { hasMatch: true, priority: 3 };
      } else if (queryableRoomData.address?.includes(tag)) {
        return { hasMatch: true, priority: 4 };
      } else if (queryableRoomData.searchTags?.some((t) => t.includes(tag))) {
        return { hasMatch: true, priority: 5 };
      } else if (queryableRoomData.majorTags?.some((t) => t.includes(tag))) {
        return { hasMatch: true, priority: 6 };
      } else if (queryableRoomData.minorTags?.some((t) => t.includes(tag))) {
        return { hasMatch: true, priority: 7 };
      }
    }

    return { hasMatch: false, priority: Number.MAX_VALUE };
  }

  // Helper function to convert RoomData to RoomDTO with field filtering and pseudo fields
  private static convertToRoomDTOs(
    rooms: { data: RoomData; sortPriority: number; docId: string }[],
    fields: (SchemaFields | PseudoFields)[]
  ): { dto: Partial<RoomDTO>; sortPriority: number }[] {
    return rooms.map((room) => {
      let processedData: any = {};

      if (fields.length === 0) {
        // If no fields provided, include all data
        processedData = { ...room.data };
      } else {
        // Filter data based on fields array
        for (const field of fields) {
          if (room.data[field as SchemaFields] != null) {
            processedData[field] = room.data[field as SchemaFields] ?? null;
          }
        }
      }

      // Add pseudo fields
      if (fields.length === 0 || fields.includes(PseudoFields.ID)) {
        processedData.id = room.docId;
      }
      if (fields.length === 0 || fields.includes(PseudoFields.IS_DELETED)) {
        processedData.isDeleted = room.data.ttl != null;
      }
      if (fields.length === 0 || fields.includes(SchemaFields.RATING)) {
        // Set default rating if null
        if (processedData.rating == null) processedData.rating = 0;
      }

      // Convert timestamps to local date strings
      Room.convertTimestamps(processedData);

      return {
        dto: processedData,
        sortPriority: room.sortPriority,
      };
    });
  }

  // Helper function to convert timestamps to date strings
  private static convertTimestamps(data: any) {
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      year: "numeric",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };

    if (data.createdOn) {
      data.createdOn = (data.createdOn as FirebaseFirestore.Timestamp)
        .toDate()
        .toLocaleDateString("en-US", dateOptions);
    }
    if (data.lastModifiedOn) {
      data.lastModifiedOn = (data.lastModifiedOn as FirebaseFirestore.Timestamp)
        .toDate()
        .toLocaleDateString("en-US", dateOptions);
    }
    if (data.ttl) {
      data.ttl = (data.ttl as FirebaseFirestore.Timestamp).toDate().toLocaleDateString("en-US", dateOptions);
    }
  }

  // Helper function to convert image links
  private static convertImageLinks(
    rooms: { dto: Partial<RoomDTO>; sortPriority: number }[],
    extUrls: ApiResponseUrlType
  ): { dto: Partial<RoomDTO>; sortPriority: number }[] {
    if (extUrls === "API_URI") {
      return rooms.map((room) => ({
        ...room,
        dto: imgConvertGsPathToApiUri(room.dto, room.dto.id!),
      }));
    }
    return rooms;
  }

  // Helper function to apply final sorting
  private static applySorting(
    rooms: { dto: Partial<RoomDTO>; sortPriority: number }[],
    params: RoomQueryParams,
    sortOn?: "capacity" | "rating" | "pricePerOccupant"
  ): Partial<RoomDTO>[] {
    const sortedResults = rooms.sort((a, b) => {
      // Handle owner queries: TTL rooms come last, then by lastModifiedOn desc
      if (params.ownerId) {
        if (a.dto.ttl && !b.dto.ttl) return 1;
        if (!a.dto.ttl && b.dto.ttl) return -1;

        if (a.dto.lastModifiedOn && b.dto.lastModifiedOn) {
          return new Date(b.dto.lastModifiedOn).getTime() - new Date(a.dto.lastModifiedOn).getTime();
        }
        return 0;
      }

      // Regular search sorting
      if (sortOn) {
        // If search tags were used, use sortPriority as secondary sort
        if (params.searchTags && params.searchTags.size > 0) {
          return (a.sortPriority ?? Number.MAX_VALUE) - (b.sortPriority ?? Number.MAX_VALUE);
        }
        return 0; // Database sorting already applied
      } else {
        // Sort primarily by search tag priority if used
        if (params.searchTags && params.searchTags.size > 0) {
          const priorityDiff = (a.sortPriority ?? Number.MAX_VALUE) - (b.sortPriority ?? Number.MAX_VALUE);
          if (priorityDiff !== 0) return priorityDiff;
        }

        // Secondary sort by lastModifiedOn desc
        if (a.dto.lastModifiedOn && b.dto.lastModifiedOn) {
          return new Date(b.dto.lastModifiedOn).getTime() - new Date(a.dto.lastModifiedOn).getTime();
        }
        return 0;
      }
    });

    return sortedResults.map((r) => r.dto);
  }
}

export default Room;
