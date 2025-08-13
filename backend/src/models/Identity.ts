import { IdentityType, Language } from "sharedtypes";
import { MultiSizePhotoModel } from "./types";

export interface IdentityPhotosModel {
  workId?: MultiSizePhotoModel;
  govId?: MultiSizePhotoModel;
  workIdIsPrivate?: boolean;
  govIdIsPrivate?: boolean;
}

export interface IdentityModel {
  email: string;
  type: IdentityType;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  language?: Language;
  profilePhotos?: MultiSizePhotoModel;
  identityPhotos?: IdentityPhotosModel;
  // AutoSetFields
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}
