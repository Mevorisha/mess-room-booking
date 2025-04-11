import { FirebaseFirestore, FirestorePaths, StoragePaths } from "@/lib/firebaseAdmin/init";
import { FieldValue } from "firebase-admin/firestore";
import { ApiResponseUrlType, AutoSetFields } from "./utils";
import { MultiSizePhoto } from "./Identity";

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
type RoomUpdateData = Partial<Omit<RoomData, AutoSetFields | "ownerId" | "acceptGender">>;
// During read, all data may be read
type RoomReadData = Partial<RoomData>;
// Params to query a room by
type RoomQueryParams = Partial<{
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
    const docRef = await ref.add({
      ...roomData,
      // Convert sets to array
      searchTags: Array.from(roomData.searchTags ?? []),
      majorTags: Array.from(roomData.majorTags ?? []),
      minorTags: Array.from(roomData.minorTags ?? []),
      // Intialise
      rating: 0,
      // Add auto fields
      createdOn: FieldValue.serverTimestamp(),
      lastModifiedOn: FieldValue.serverTimestamp(),
    });
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

    await ref.set(updateDataFrstrFormat, { merge: true });
  }

  static async queryAll(
    params: RoomQueryParams,
    extUrls: ApiResponseUrlType,
    sortOn?: "capacity" | "rating" | "pricePerOccupant",
    sortOrder?: "asc" | "desc"
  ): Promise<RoomReadDataWithId[]> {
    const ref = FirebaseFirestore.collection(FirestorePaths.ROOMS);

    let query: FirebaseFirestore.Query;
    const queryOrRef = () => (query ? query : ref);

    // Apply filters for exact matches
    if (params.ownerId) {
      query = queryOrRef().where(SchemaFields.OWNER_ID, "==", params.ownerId);
    }
    if (params.acceptGender) {
      query = queryOrRef().where(SchemaFields.ACCEPT_GENDER, "==", params.acceptGender);
    }
    if (params.acceptOccupation) {
      query = queryOrRef().where(SchemaFields.ACCEPT_OCCUPATION, "==", params.acceptOccupation);
    }
    if (params.landmark) {
      query = queryOrRef().where(SchemaFields.LANDMARK, "==", params.landmark);
    }
    if (params.city) {
      query = queryOrRef().where(SchemaFields.CITY, "==", params.city);
    }
    if (params.state) {
      query = queryOrRef().where(SchemaFields.STATE, "==", params.state);
    }
    if (params.capacity) {
      query = queryOrRef().where(SchemaFields.CAPACITY, ">=", params.capacity);
    }

    // Price range filters
    if (params.lowPrice) {
      query = queryOrRef().where(SchemaFields.PRICE_PER_OCCUPANT, ">=", params.lowPrice);
    }
    if (params.highPrice) {
      query = queryOrRef().where(SchemaFields.PRICE_PER_OCCUPANT, "<=", params.highPrice);
    }

    // Timestamp filters
    if (params.createdOn) {
      query = queryOrRef().where(SchemaFields.CREATED_ON, ">=", params.createdOn);
    }
    if (params.lastModifiedOn) {
      query = queryOrRef().where(SchemaFields.LAST_MODIFIED_ON, ">=", params.lastModifiedOn);
    }

    // Apply sorting if specified
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
        query = queryOrRef().orderBy(fieldToSort, direction);
      }
    }

    // Execute query
    const snapshot = await queryOrRef().get();
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
    return results;
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
