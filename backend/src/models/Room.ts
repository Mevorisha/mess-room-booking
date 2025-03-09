import { FirebaseFirestore, FirestorePaths, StoragePaths } from "@/lib/firebaseAdmin/init";
import { Timestamp } from "firebase-admin/firestore";
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
  images: Array<string>;
  capacity: number;
  pricePerOccupant: number;
  isUnavailable?: boolean;
  // AutoSetFields
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}

// During create, apart from AutoSetFields, isUnavailable MUST not be set
type RoomCreateData = Omit<RoomData, AutoSetFields | "isUnavailable">;
// During update, apart from AutoSetFields, ownerId & acceptGender may not be changed
type RoomUpdateData = Partial<Omit<RoomData, AutoSetFields | "ownerId" | "acceptGender">>;
// During read, all data may be read
type RoomReadData = Partial<RoomData>;

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
    const createdOn = Timestamp.now();
    const docRef = await ref.add({ ...roomData, createdOn });
    return docRef.id;
  }

  /**
   * Update an existing room document
   */
  static async update(roomId: string, updateData: RoomUpdateData): Promise<void> {
    const ref = FirestorePaths.Rooms(roomId);
    const lastModifiedOn = Timestamp.now();
    await ref.set({ ...updateData, lastModifiedOn }, { merge: true });
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
