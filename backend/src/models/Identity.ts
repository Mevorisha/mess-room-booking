import { FirestorePaths, StoragePaths } from "@/firebase/init";
import { CustomApiError } from "@/types/CustomApiError";
import { FieldValue } from "firebase-admin/firestore";
import { ApiResponseUrlType, AutoSetFields, IdentityType, Language, MultiSizePhoto } from "./types";

export interface IdentityPhotos {
  workId?: MultiSizePhoto;
  govId?: MultiSizePhoto;
  workIdIsPrivate?: boolean;
  govIdIsPrivate?: boolean;
}

interface IdentityData {
  email: string;
  type: IdentityType;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  language?: Language;
  profilePhotos?: MultiSizePhoto;
  identityPhotos?: IdentityPhotos;
  // AutoSetFields
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}

// During create, only email & type may be set
type IdentityCreateData = Pick<IdentityData, "email"> & { type: IdentityType | "EMPTY" };

// During update, AutoSetFields MUST not be set
type IdentityUpdateData = Partial<Omit<IdentityData, AutoSetFields>>;

/**
 * Identity Data Transfer Object (DTO)
 * Represents the structure of an identity object used in the application.
 * This is based on backend/src/models/Identity.ts
 */
export interface IdentityDTO {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  profilePhotos?: MultiSizePhoto;
  // only for logged in user
  email?: string;
  type?: IdentityType;
  identityPhotos?: IdentityPhotos;
  language?: Language;
  createdOn?: string;
  lastModifiedOn?: string;
  ttl?: string;
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
  CREATED_ON = "createdOn",
  LAST_MODIFIED_ON = "lastModifiedOn",
  TTL = "ttl",
}

export enum PsudoFields {
  DISPLAY_NAME = "displayName",
}

function imgConvertGsPathToApiUri<T extends { profilePhotos?: MultiSizePhoto; identityPhotos?: IdentityPhotos }>(
  dataToUpdate: T,
  uid: string
) {
  // convert image paths in profile photos to URLs
  if (dataToUpdate.profilePhotos != null) {
    dataToUpdate.profilePhotos = {
      small: StoragePaths.ProfilePhotos.apiUri(uid, "small"),
      medium: StoragePaths.ProfilePhotos.apiUri(uid, "medium"),
      large: StoragePaths.ProfilePhotos.apiUri(uid, "large"),
    };
  }
  if (dataToUpdate.identityPhotos != null) {
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
    const ids: { workId?: MultiSizePhoto; govId?: MultiSizePhoto } = {};
    if (dataToUpdate.identityPhotos.workId != null) ids.workId = workId;
    if (dataToUpdate.identityPhotos.govId != null) ids.govId = govId;
    dataToUpdate.identityPhotos = {
      ...ids,
      workIdIsPrivate: dataToUpdate.identityPhotos.workIdIsPrivate ?? true,
      govIdIsPrivate: dataToUpdate.identityPhotos.govIdIsPrivate ?? true,
    };
  }
  return dataToUpdate;
}

class Identity {
  /**
   * Create a new identity document
   */
  static async create(uid: string, email: string): Promise<void> {
    const identityData: IdentityCreateData = { email, type: "EMPTY" };
    const ref = FirestorePaths.Identity(uid);
    await ref.set(
      { ...identityData, createdOn: FieldValue.serverTimestamp(), lastModifiedOn: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  /**
   * Update an existing identity document
   */
  static async update(uid: string, updateData: IdentityUpdateData): Promise<void> {
    const ref = FirestorePaths.Identity(uid);
    const docSnapshot = await ref.get();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (!docSnapshot || !docSnapshot.exists) {
      return Promise.reject(CustomApiError.create(404, "User not found"));
    }
    await ref.set({ ...updateData, lastModifiedOn: FieldValue.serverTimestamp() }, { merge: true });
  }

  /**
   * Get specific fields from an identity document
   */
  static async get(
    uid: string,
    extUrls: ApiResponseUrlType,
    fields: (SchemaFields | PsudoFields)[] = []
  ): Promise<IdentityDTO | null> {
    const ref = FirestorePaths.Identity(uid);

    const doc = await ref.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (data == null) {
      return null;
    }

    // Compose pseduo fields
    if (fields.length === 0 || fields.includes(PsudoFields.DISPLAY_NAME)) {
      data["displayName"] = [data["firstName"], data["lastName"]].filter(Boolean).join(" ");
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      year: "numeric",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };

    // convert timestamps to ISO Locale strings
    if (data["createdOn"] != null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      data["createdOn"] = data["createdOn"].toDate().toLocaleDateString("en-US", dateOptions);
    }
    if (data["lastModifiedOn"] != null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      data["lastModifiedOn"] = data["lastModifiedOn"].toDate().toLocaleDateString("en-US", dateOptions);
    }
    if (data["ttl"] != null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      data["ttl"] = data["ttl"].toDate().toLocaleDateString("en-US", dateOptions);
    }

    // If no fields are provided, return the entire document
    if (fields.length === 0) {
      if (extUrls === "API_URI") {
        return imgConvertGsPathToApiUri(data, uid);
      } else {
        return data;
      }
    }

    // Return only requested fields
    const result = {} as IdentityDTO;
    for (const field of fields) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/strict-boolean-expressions
      (result as any)[field] = data[field] || null;
    }

    // convert image paths to api uri if any
    if (extUrls === "API_URI") {
      return imgConvertGsPathToApiUri(result, uid);
    } else {
      return result;
    }
  }
}

export default Identity;
