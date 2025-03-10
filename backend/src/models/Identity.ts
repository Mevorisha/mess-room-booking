import { FirestorePaths, StoragePaths } from "@/lib/firebaseAdmin/init";
import { CustomApiError } from "@/lib/utils/ApiError";

export interface MultiSizePhoto {
  small: string;
  medium: string;
  large: string;
}

export interface IdentityPhotos {
  workId?: MultiSizePhoto;
  govId?: MultiSizePhoto;
  workIdIsPrivate?: boolean;
  govIdIsPrivate?: boolean;
}

export type Language = "ENGLISH" | "BANGLA" | "HINDI";

export type IdentityType = "OWNER" | "TENANT";

interface IdentityData {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email: string;
  language?: Language;
  profilePhotos?: MultiSizePhoto;
  identityPhotos?: IdentityPhotos;
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
  IDENTITY_PHOTOS = "identityPhotos",
  TYPE = "type",
  TTL = "ttl",
}

export enum PsudoFields {
  DISPLAY_NAME = "displayName",
}

function imgConvertGsPathToApiUri(dataToUpdate: IdentityData, uid: string) {
  // convert image paths in profile photos to URLs
  if (dataToUpdate.profilePhotos) {
    dataToUpdate.profilePhotos = {
      small: StoragePaths.ProfilePhotos.apiUri(uid, "small"),
      medium: StoragePaths.ProfilePhotos.apiUri(uid, "medium"),
      large: StoragePaths.ProfilePhotos.apiUri(uid, "large"),
    };
  }
  if (dataToUpdate.identityPhotos) {
    const workId = {
      small: StoragePaths.IdentityDocuments.apiUri(uid, "WORK_ID", "small"),
      medium: StoragePaths.IdentityDocuments.apiUri(uid, "WORK_ID", "medium"),
      large: StoragePaths.IdentityDocuments.apiUri(uid, "WORK_ID", "large"),
    };
    const govId = {
      small: StoragePaths.IdentityDocuments.apiUri(uid, "GOV_ID", "small"),
      medium: StoragePaths.IdentityDocuments.apiUri(uid, "GOV_ID", "medium"),
      large: StoragePaths.IdentityDocuments.apiUri(uid, "GOV_ID", "large"),
    };
    dataToUpdate.identityPhotos = {
      workId: dataToUpdate.identityPhotos.workId && workId,
      govId: dataToUpdate.identityPhotos.govId && govId,
      workIdIsPrivate: dataToUpdate.identityPhotos.workIdIsPrivate,
      govIdIsPrivate: dataToUpdate.identityPhotos.govIdIsPrivate,
    };
  }
  return dataToUpdate;
}

class Identity {
  /**
   * Create a new identity document
   */
  static async create(uid: string, email: string): Promise<void> {
    const ref = FirestorePaths.Identity(uid);
    try {
      await ref.set({ email, type: "EMPTY" }, { merge: true });
    } catch (e) {
      return Promise.reject(CustomApiError.create(500, e.message));
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
        return Promise.reject(CustomApiError.create(404, "User not found"));
      }
      await ref.set(updateData, { merge: true });
    } catch (e) {
      return Promise.reject(CustomApiError.create(500, e.message));
    }
  }

  /**
   * Get specific fields from an identity document
   */
  static async get(
    uid: string,
    extUrls: "GS_PATH" | "API_URI",
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
        if (extUrls === "API_URI") return imgConvertGsPathToApiUri(data as IdentityData, uid);
        else return data;
      }
      // Return only requested fields
      const result = {} as Partial<IdentityData & { displayName: string }>;
      for (const field of fields) {
        (result as any)[field] = data[field] || null;
      }
      // convert image paths to api uri if any
      if (extUrls === "API_URI") return imgConvertGsPathToApiUri(result as IdentityData, uid);
      else return result;
    } catch (e) {
      return Promise.reject(CustomApiError.create(500, e.message));
    }
  }
}

export default Identity;
