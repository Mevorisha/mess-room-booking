import { getFirestore } from "firebase-admin/firestore";
import { FirestorePaths } from "../lib/firebaseAdmin/init.js";
import { imagePathToUrl } from "./utils.js";

/**
 * @typedef {"MALE" | "FEMALE" | "OTHER"} AcceptGender
 * @typedef {"STUDENT" | "PROFESSIONAL" | "ANY"} AcceptOccupation
 */

/**
 * @typedef {Object} RoomData
 * @property {string} ownerId
 * @property {AcceptGender} acceptGender
 * @property {AcceptOccupation} acceptOccupation
 * @property {Set<string>} landmarkTags
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {Set<string>} majorTags
 * @property {Set<string>} minorTags
 * @property {Array<string>} images
 * @property {number} capacity
 * @property {number} pricePerOccupant
 * @property {boolean} [isAvailable]
 * @property {FirebaseFirestore.Timestamp} [ttl]
 */

const SchemaFields = [
  "ownerId",
  "acceptGender",
  "acceptOccupation",
  "landmarkTags",
  "address",
  "city",
  "state",
  "majorTags",
  "minorTags",
  "images",
  "capacity",
  "pricePerOccupant",
  "isAvailable",
  "ttl",
];

class Room {
  /**
   * Create a new room document
   * @param {RoomData} roomData
   * @returns {Promise<string>} Room ID
   */
  static async create(roomData) {
    const ref = getFirestore().collection(FirestorePaths.ROOMS);
    const docRef = await ref.add(roomData);
    return docRef.id;
  }

  /**
   * Update an existing room document
   * @param {string} id
   * @param {Partial<RoomData>} updateData
   * @returns {Promise<void>}
   */
  static async update(id, updateData) {
    const ref = FirestorePaths.Rooms(id);
    await ref.set(updateData, { merge: true });
  }

  /**
   * Get specific fields from a room document
   * @param {string} id
   * @param {string[]} [fields]
   * @returns {Promise<Partial<RoomData> | null>}
   */
  static async get(id, fields = []) {
    for (const field of fields) {
      if (!SchemaFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
      }
    }

    const ref = FirestorePaths.Rooms(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) {
      return null;
    }

    if (fields.length === 0) {
      if (data.images) {
        await imagePathToUrl(data, "images");
      }
      return data;
    }

    const result = {};
    for (const field of fields) {
      result[field] = data[field] !== undefined ? data[field] : null;
    }

    if (result.images) {
      await imagePathToUrl(result, "images");
    }

    return result;
  }
}

export default Room;
