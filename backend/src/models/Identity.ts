import { IdentityType, Language } from "sharedtypes";
import { MultiSizePhoto } from "./types";

export interface IdentityPhotosModel {
  workId?: MultiSizePhoto;
  govId?: MultiSizePhoto;
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
  profilePhotos?: MultiSizePhoto;
  identityPhotos?: IdentityPhotosModel;
  // AutoSetFields
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}
