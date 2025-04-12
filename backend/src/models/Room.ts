import { FirebaseFirestore, FirestorePaths, StoragePaths } from "@/lib/firebaseAdmin/init";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { ApiResponseUrlType, AutoSetFields } from "./utils";
import { MultiSizePhoto } from "./Identity";
import { CustomApiError } from "@/lib/utils/ApiError";
import Booking from "./Booking";

export type AcceptGender = "MALE" | "FEMALE" | "OTHER";

export type AcceptOccupation = "STUDENT" | "PROFESSIONAL" | "ANY";

export interface RoomData {
  ownerId: string;
  acceptGender: AcceptGender;
  acceptOccupation: AcceptOccupation;
  searchTags: Set<string>;
  landmark: string;
  address: string;
  city: string;
  state: string;
  majorTags: Set<string>;
  minorTags: Set<string>;
  capacity: number;
  pricePerOccupant: number;
  // Set later on
  images?: Array<MultiSizePhoto>;
  isUnavailable?: boolean;
  // 0 to 5
  rating?: number;
  // AutoSetFields
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}

// During create, apart from AutoSetFields, isUnavailable MUST not be set
export type RoomCreateData = Omit<RoomData, AutoSetFields | "images" | "isUnavailable">;
// During update, apart from AutoSetFields, ownerId & acceptGender may not be changed
export type RoomUpdateData = Partial<Omit<RoomData, AutoSetFields | "isUnavailable" | "ownerId" | "acceptGender">>;
// During read, all data may be read
type RoomReadData = Partial<RoomData>;
// Params to query a room by
type RoomQueryParams = Partial<{
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
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  searchTags: Set<string>;
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

function imgConvertGsPathToApiUri(dataToBeUpdated: RoomReadData, roomId: string) {
  if (dataToBeUpdated.images) {
    // prettier-ignore
    dataToBeUpdated.images = dataToBeUpdated.images.map((imgGsPaths: MultiSizePhoto) => ({
      small: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.small), "small"),
      medium: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.medium), "medium"),
      large: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.large), "large"),
    }));
  }
  return dataToBeUpdated;
}

type RoomReadDataWithId = RoomReadData & { id: string };

class Room {
  /**
   * Create a new room document
   */
  static async create(roomData: RoomCreateData): Promise<string> {
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
    const ref = FirestorePaths.Rooms(roomId);

    const updateDataFrstrFormat: Record<string, any> = {
      ...updateData,
      lastModifiedOn: FieldValue.serverTimestamp(),
    };

    // Convert sets to array
    // Make sure u update the array type fields only if they exist in given data
    if (updateDataFrstrFormat.searchTags) updateDataFrstrFormat.searchTags = Array.from(updateData.searchTags);
    if (updateDataFrstrFormat.majorTags) updateDataFrstrFormat.majorTags = Array.from(updateData.majorTags);
    if (updateDataFrstrFormat.minorTags) updateDataFrstrFormat.minorTags = Array.from(updateData.minorTags);

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
    const bookings = await Booking.queryAll({
      roomId: roomId,
      isCancelled: false,
      isCleared: false,
    });

    // If we found any bookings, the room has active bookings
    return bookings.length > 0;
  }

  static async queryAll(
    params: RoomQueryParams,
    extUrls: ApiResponseUrlType,
    sortOn?: "capacity" | "rating" | "pricePerOccupant",
    sortOrder?: "asc" | "desc"
  ): Promise<RoomReadDataWithId[]> {
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

    // Price range filters
    if (params.lowPrice) {
      query = query.where(SchemaFields.PRICE_PER_OCCUPANT, ">=", params.lowPrice);
    }
    if (params.highPrice) {
      query = query.where(SchemaFields.PRICE_PER_OCCUPANT, "<=", params.highPrice);
    }

    // Timestamp filters
    if (params.createdOn) {
      query = query.where(SchemaFields.CREATED_ON, ">=", params.createdOn);
    }
    if (params.lastModifiedOn) {
      query = query.where(SchemaFields.LAST_MODIFIED_ON, ">=", params.lastModifiedOn);
    }

    if (!params.self) {
      // TTL and isUnavailable filter (unconditional filters)
      // Only available Rooms that are not to be deleted will appear in search results
      query = query.where(SchemaFields.IS_UNAVAILABLE, "==", false);
    }

    // Apply sorting if specified by user
    if (sortOn) {
      const fieldToSort =
        sortOn === "pricePerOccupant"
          ? SchemaFields.PRICE_PER_OCCUPANT
          : sortOn === "capacity"
          ? SchemaFields.CAPACITY
          : sortOn === "rating"
          ? SchemaFields.RATING
          : null;

      if (fieldToSort) {
        const direction = sortOrder === "desc" ? "desc" : "asc";
        query = query.orderBy(fieldToSort, direction);
      }
    } else {
      // Default sorting by lastModifiedOn if no sortOn specified
      query = query.orderBy(SchemaFields.LAST_MODIFIED_ON, "desc");
    }

    // Execute query
    const snapshot = await query.get();
    const results: RoomReadDataWithId[] = [];

    // Process results and apply any tag filters in code
    // (since we can't query array containment for multiple arrays effectively)
    for (const doc of snapshot.docs) {
      const data = doc.data() as RoomReadData;

      // Filter by tags if specified
      if (params.searchTags && params.searchTags.size > 0) {
        // Convert arrays to Sets for easier checking
        const searchTags = new Set(data.searchTags || []);
        const majorTags = new Set(data.majorTags || []);
        const minorTags = new Set(data.minorTags || []);

        // Check if any tag in searchTags matches in searchTags, majorTags, or minorTags
        let hasMatchingTag = false;
        for (const tag of params.searchTags) {
          if (searchTags.has(tag) || majorTags.has(tag) || minorTags.has(tag)) {
            hasMatchingTag = true;
            break;
          }
        }

        if (!hasMatchingTag) {
          continue; // Skip this document if no matching tags
        }
      }

      // Convert back to sets from arrays in the result
      if (data.searchTags) data.searchTags = new Set(data.searchTags);
      if (data.majorTags) data.majorTags = new Set(data.majorTags);
      if (data.minorTags) data.minorTags = new Set(data.minorTags);

      results.push({ ...data, id: doc.id });
    }

    if (extUrls === "API_URI") results.map((roomData) => imgConvertGsPathToApiUri(roomData, roomData.id));

    // For the "self" parameter, instead of filtering out TTL records completely,
    // we now need to sort them to appear at the bottom
    if (!params.self) {
      // Filter out rooms with TTL for non-self queries
      return results.filter((data) => !data.ttl);
    } else {
      // For self queries, sort rooms with TTL to appear at the bottom
      // Within each group (with TTL and without TTL), maintain the lastModifiedOn ordering
      return results.sort((a, b) => {
        // If one has TTL and the other doesn't, the one without TTL comes first
        if (a.ttl && !b.ttl) return 1;
        if (!a.ttl && b.ttl) return -1;

        // Within the same group (both have TTL or both don't have TTL),
        // sort by lastModifiedOn in descending order (newest first)
        if (a.lastModifiedOn && b.lastModifiedOn) {
          return b.lastModifiedOn.toMillis() - a.lastModifiedOn.toMillis();
        }

        // If lastModifiedOn is missing on either, maintain original order
        return 0;
      });
    }
  }

  /**
   * Get specific fields from a room document
   */
  static async get(
    roomId: string,
    extUrls: ApiResponseUrlType,
    fields: SchemaFields[] = []
  ): Promise<RoomReadData | null> {
    const ref = FirestorePaths.Rooms(roomId);

    const doc = await ref.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) {
      return null;
    }

    // If no fields provided, send all params
    if (fields.length === 0) {
      // convert image paths to direct urls
      if (extUrls === "API_URI") return imgConvertGsPathToApiUri(data as RoomData, roomId);
      else return data;
    }

    // Filter params
    const result = {} as RoomReadData;
    for (const field of fields) {
      (result as any)[field] = data[field] || null;
    }

    // convert image paths to api uri if any
    if (extUrls === "API_URI") {
      return imgConvertGsPathToApiUri(result as RoomData, roomId);
    } else {
      return result;
    }
  }
}

export default Room;
