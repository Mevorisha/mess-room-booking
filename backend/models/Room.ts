import { getFirestore } from "firebase-admin/firestore";
import { FirestorePaths } from "../lib/firebaseAdmin/init.js";
import { imagePathToUrl } from "./utils.js";
import { ApiError } from "../lib/utils/ApiError.js";

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
  isAvailable?: boolean;
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
  IS_AVAILABLE = "isAvailable",
  TTL = "ttl",
}

class Room {
  /**
   * Create a new room document
   */
  static async create(roomData: RoomData): Promise<string> {
    const ref = getFirestore().collection(FirestorePaths.ROOMS);
    try {
      const docRef = await ref.add(roomData);
      return docRef.id;
    } catch (e) {
      return Promise.reject(ApiError.create(500, e.message));
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
      return Promise.reject(ApiError.create(500, e.message));
    }
  }

  /**
   * Get specific fields from a room document
   */
  static async get(id: string, fields: SchemaFields[] = []): Promise<Partial<RoomData> | null> {
    const ref = FirestorePaths.Rooms(id);
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
        if (data.images) {
          await imagePathToUrl(data, "images");
        }
        return data;
      }
      // Filter params
      const result = {} as Partial<RoomData>;
      for (const field of fields) {
        result[field] = data[field] || null;
      }
      if (result.images) {
        await imagePathToUrl(result, "images");
      }
      return result;
    } catch (e) {
      return Promise.reject(ApiError.create(500, e.message));
    }
  }
}

export default Room;
