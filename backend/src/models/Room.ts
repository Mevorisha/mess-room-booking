import { FirebaseFirestore, FirestorePaths, StoragePaths } from "@/lib/firebaseAdmin/init";
import { CustomApiError } from "@/lib/utils/ApiError";

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
  ttl?: FirebaseFirestore.Timestamp;
}

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
  static async create(roomData: RoomData): Promise<string> {
    const ref = FirebaseFirestore.collection(FirestorePaths.ROOMS);
    try {
      const docRef = await ref.add(roomData);
      return docRef.id;
    } catch (e) {
      return Promise.reject(CustomApiError.create(500, e.message));
    }
  }

  /**
   * Update an existing room document
   * @param {string} id
   * @param {Partial<RoomData>} updateData
   * @returns {Promise<void>}
   */
  static async update(id: string, updateData: Partial<RoomData>): Promise<void> {
    const ref = FirestorePaths.Rooms(id);
    try {
      await ref.set(updateData, { merge: true });
    } catch (e) {
      return Promise.reject(CustomApiError.create(500, e.message));
    }
  }

  /**
   * Get specific fields from a room document
   */
  static async get(
    roomId: string,
    extUrls: "GS_PATH" | "API_URI",
    fields: SchemaFields[] = []
  ): Promise<Partial<RoomData> | null> {
    const ref = FirestorePaths.Rooms(roomId);
    try {
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
      const result = {} as Partial<RoomData>;
      for (const field of fields) {
        (result as any)[field] = data[field] || null;
      }
      // convert image paths to api uri if any
      if (extUrls === "API_URI") return imgConvertGsPathToApiUri(result as RoomData, roomId);
      else return result;
    } catch (e) {
      return Promise.reject(CustomApiError.create(500, e.message));
    }
  }
}

export default Room;
