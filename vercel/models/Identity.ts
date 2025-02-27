import { FirestorePaths } from "../lib/firebaseAdmin/init.js";
import { ApiError } from "../lib/utils/ApiError.js";
import { imagePathToUrl } from "./utils.js";

interface ProfilePhotos {
  small: string;
  medium: string;
  large: string;
}

type Language = "ENGLISH" | "BANGLA" | "HINDI";

type IdentityType = "OWNER" | "TENANT";

interface IdentityData {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email: string;
  language?: Language;
  profilePhotos?: ProfilePhotos;
  type: IdentityType;
  ttl?: FirebaseFirestore.Timestamp;
}

export enum SchemaFields {
  FIRST_NAME = "firstName",
  LAST_NAME = "lastName",
  MOBILE = "mobile",
  EMAIL = "email",
  LANGUAGE = "language",
  PROFILE_PHOTOS = "profilePhotos",
  TYPE = "type",
  TTL = "ttl",
}

export enum PsudoFields {
  DISPLAY_NAME = "displayName",
}

class Identity {
  /**
   * Create a new identity document
   */
  static async create(uid: string, email: string, type: IdentityType): Promise<void> {
    const ref = FirestorePaths.Identity(uid);
    try {
      await ref.set({ email, type }, { merge: true });
    } catch (e) {
      return Promise.reject(ApiError.create(500, e.message));
    }
  }

  /**
   * Update an existing identity document
   */
  static async update(uid: string, updateData: Partial<IdentityData>): Promise<void> {
    const ref = FirestorePaths.Identity(uid);
    try {
      const docSnapshot = await ref.get();
      if (!docSnapshot || !docSnapshot.exists) {
        return Promise.reject(ApiError.create(404, "User not found"));
      }
      await ref.set(updateData, { merge: true });
    } catch (e) {
      return Promise.reject(ApiError.create(500, e.message));
    }
  }

  /**
   * Get specific fields from an identity document
   */
  static async get(
    uid: string,
    fields: (SchemaFields | PsudoFields)[] = []
  ): Promise<Partial<IdentityData & { displayName: string }> | null> {
    const ref = FirestorePaths.Identity(uid);
    try {
      const doc = await ref.get();
      if (!doc.exists) {
        return null;
      }
      const data = doc.data();
      if (!data) {
        return null;
      }
      // Compose pseduo fields
      data.displayName = [data.firstName, data.lastName].filter(Boolean).join(" ");
      // If no fields are provided, return the entire document
      if (fields.length === 0) {
        // convert image paths in profile photos to URLs
        if (data.profilePhotos) {
          await imagePathToUrl(data, "profilePhotos");
        }
        return data;
      }
      // Return only requested fields
      const result = {} as Partial<IdentityData & { displayName: string }>;
      for (const field of fields) {
        result[field] = data[field] || null;
      }
      // convert image paths in profile photos to URLs
      if (result.profilePhotos) {
        await imagePathToUrl(result, "profilePhotos");
      }
      return result;
    } catch (e) {
      return Promise.reject(ApiError.create(500, e.message));
    }
  }
}

export default Identity;
