import MultiSizePhoto from "./MultiSizePhoto";

export interface IdentityPhotos {
  workId?: MultiSizePhoto;
  govId?: MultiSizePhoto;
  workIdIsPrivate?: boolean;
  govIdIsPrivate?: boolean;
}

export type Language = "ENGLISH" | "BANGLA" | "HINDI";
export type IdentityType = "OWNER" | "TENANT";

/**
 * Identity Data Transfer Object (DTO)
 * Represents the structure of an identity object used in the application.
 * This is based on backend/src/models/Identity.ts
 */
export default interface IdentityDTO {
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
