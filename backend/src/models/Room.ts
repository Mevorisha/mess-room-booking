import { FirebaseFirestore, FirestorePaths, StoragePaths } from "@/lib/firebaseAdmin/init";
import { FieldValue } from "firebase-admin/firestore";
import { ApiResponseUrlType, AutoSetFields } from "./utils";

export type AcceptGender = "MALE" | "FEMALE" | "OTHER";

export type AcceptOccupation = "STUDENT" | "PROFESSIONAL" | "ANY";

export interface RoomData {
  ownerId: string;
  acceptGender: AcceptGender;
  acceptOccupation: AcceptOccupation;
  landmarkTags: Set<string>;
  address: string;
  city: string;
  state: string;
  majorTags: Set<string>;
  minorTags: Set<string>;
  capacity: number;
  pricePerOccupant: number;
  // Set later on
  images?: Array<string>;
  isUnavailable?: boolean;
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
  acceptGender: AcceptGender;
  acceptOccupation: AcceptOccupation;
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
  LANDMARK_TAGS = "landmarkTags",
  ADDRESS = "address",
  CITY = "city",
  STATE = "state",
  MAJOR_TAGS = "majorTags",
  MINOR_TAGS = "minorTags",
  IMAGES = "images",
  CAPACITY = "capacity",
  PRICE_PER_OCCUPANT = "pricePerOccupant",
  IS_UNAVAILABLE = "isUnavailable",
  CREATED_ON = "createdOn",
  LAST_MODIFIED_ON = "lastModifiedOn",
  TTL = "ttl",
}

function imgConvertGsPathToApiUri(dataToBeUpdated: RoomData, roomId: string) {
  if (dataToBeUpdated.images) {
    dataToBeUpdated.images = Array.from(dataToBeUpdated.images as Array<string>).map((imgGsPath: string) =>
      StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPath))
    );
  }

  return dataToBeUpdated;
}

class Room {
  /**
   * Create a new room document
   */
  static async create(roomData: RoomCreateData): Promise<string> {
    const ref = FirebaseFirestore.collection(FirestorePaths.ROOMS);
    const docRef = await ref.add({
      ...roomData,
      // Convert sets to array
      landmarkTags: Array.from(roomData.landmarkTags ?? []),
      majorTags: Array.from(roomData.majorTags ?? []),
      minorTags: Array.from(roomData.minorTags ?? []),
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
    await ref.set(
      {
        ...updateData,
        // Convert sets to array
        landmarkTags: Array.from(updateData.landmarkTags ?? []),
        majorTags: Array.from(updateData.majorTags ?? []),
        minorTags: Array.from(updateData.minorTags ?? []),
        // Add auto fields
        createdOn: FieldValue.serverTimestamp(),
        lastModifiedOn: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  static async queryAll(params: RoomQueryParams): Promise<RoomReadData[]> {
    return;
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
