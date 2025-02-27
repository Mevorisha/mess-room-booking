import firestore, { getFirestore } from "firebase-admin/firestore";
import { FirestorePaths } from "../lib/firebaseAdmin/init.js";

/**
 * @typedef {"ACCEPTED" | "REJECTED"} AcceptanceStatus
 */

/**
 * @typedef {Object} BookingData
 * @property {string} tenantId
 * @property {string} roomId
 * @property {number} occupantCount
 * @property {FirebaseFirestore.Timestamp} requestedOn
 * @property {AcceptanceStatus} [acceptance]
 * @property {FirebaseFirestore.Timestamp} [acceptedOn]
 * @property {FirebaseFirestore.Timestamp} [cancelledOn]
 * @property {FirebaseFirestore.Timestamp} [clearedOn]
 * @property {FirebaseFirestore.Timestamp} [ttl]
 */

const SchemaFields = [
  "tenantId",
  "roomId",
  "occupantCount",
  "requestedOn",
  "acceptance",
  "acceptedOn",
  "cancelledOn",
  "clearedOn",
  "ttl",
];

const OneTimeSetFields = [
  "acceptance",
  "acceptedOn",
  "cancelledOn",
  "clearedOn",
];

class Booking {
  /**
   * Create a new booking document
   * @param {string} tenantId
   * @param {string} roomId
   * @param {number} occupantCount
   * @returns {Promise<string>} Booking ID
   */
  static async create(tenantId, roomId, occupantCount) {
    const ref = getFirestore().collection(FirestorePaths.BOOKINGS);
    const requestedOn = firestore.Timestamp.now();
    const docRef = await ref.add({ tenantId, roomId, occupantCount, requestedOn });
    return docRef.id;
  }

  /**
   * Update an existing booking document
   * @param {string} id
   * @param {Partial<BookingData>} updateData
   * @returns {Promise<void>}
   */
  static async update(id, updateData) {
    for (const field of OneTimeSetFields) {
      if (updateData[field] !== undefined) {
        throw new Error(`Cannot update one-time-set field: ${field}`);
      }
    }

    const ref = FirestorePaths.Bookings(id);
    await ref.set(updateData, { merge: true });
  }

  /**
   * Get specific fields from a booking document
   * @param {string} id
   * @param {string[]} [fields]
   * @returns {Promise<Partial<BookingData & { isAccepted: boolean, isCancelled: boolean, isCleared: boolean }> | null>}
   */
  static async get(id, fields = []) {
    const schemaWithPseudoFields = [
      ...SchemaFields,
      "isAccepted",
      "isCancelled",
      "isCleared",
    ];

    for (const field of fields) {
      if (!schemaWithPseudoFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
      }
    }

    const ref = FirestorePaths.Bookings(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) {
      return null;
    }

    // Add pseudo fields
    data.isAccepted = !!data.acceptedOn;
    data.isCancelled = !!data.cancelledOn;
    data.isCleared = !!data.clearedOn;

    if (fields.length === 0) {
      return data;
    }

    const result = {};
    for (const field of fields) {
      result[field] = data[field] !== undefined ? data[field] : null;
    }

    return result;
  }
}

export default Booking;
