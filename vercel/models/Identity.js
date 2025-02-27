import { FirestorePaths } from "../lib/firebaseAdmin/init.js";
import { imagePathToUrl } from "./utils.js";

/**
 * @typedef {Object} ProfilePhotos
 * @property {string} small
 * @property {string} medium
 * @property {string} large
 */

/**
 * @typedef {"ENGLISH" | "BANGLA" | "HINDI"} Language
 */

/**
 * @typedef {"OWNER" | "TENANT"} IdentityType
 */

/**
 * @typedef {Object} IdentityData
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [mobile]
 * @property {string} email
 * @property {Language} [language]
 * @property {ProfilePhotos} [profilePhotos]
 * @property {IdentityType} type
 * @property {FirebaseFirestore.Timestamp} [ttl]
 */

const SchemaFields = [
  "firstName",
  "lastName",
  "mobile",
  "email",
  "language",
  "profilePhotos",
  "type",
  "ttl",
];

class Identity {
  /**
   * Create a new identity document
   * @param {string} uid
   * @param {string} email
   * @param {IdentityType} type
   * @returns {Promise<void>}
   */
  static async create(uid, email, type) {
    const ref = FirestorePaths.Identity(uid);
    await ref.set({ email, type }, { merge: true });
  }

  /**
   * Update an existing identity document
   * @param {string} uid
   * @param {Partial<IdentityData>} updateData
   * @returns {Promise<void>}
   */
  static async update(uid, updateData) {
    const ref = FirestorePaths.Identity(uid);
    await ref.set(updateData, { merge: true });
  }

  /**
   * Get specific fields from an identity document
   * @param {string} uid
   * @param {string[]} [fields] - Optional fields to retrieve. If empty, return all fields.
   * @returns {Promise<Partial<IdentityData & { displayName: string }> | null>}
   */
  static async get(uid, fields = []) {
    const schemaWithPseudoFields = [...SchemaFields, "displayName"];

    // Validate requested fields
    for (const field of fields) {
      if (!schemaWithPseudoFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
      }
    }

    const ref = FirestorePaths.Identity(uid);
    const doc = await ref.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) {
      return null;
    }

    data.displayName = [data.firstName, data.lastName]
      .filter(Boolean)
      .join(" ");

    // If no fields are provided, return the entire document
    if (fields.length === 0) {
      // convert image paths in profile photos to URLs
      if (data.profilePhotos) {
        await imagePathToUrl(data, "profilePhotos");
      }
      return data;
    }

    // Return only requested fields
    const result = {};
    for (const field of fields) {
      result[field] = data[field] !== undefined ? data[field] : null;
    }

    // convert image paths in profile photos to URLs
    if (result.profilePhotos) {
      await imagePathToUrl(result, "profilePhotos");
    }

    return result;
  }
}

export default Identity;
