import MultiSizePhoto from "./MultiSizePhoto";

export interface IdentityPhotos {
  workId?: MultiSizePhoto;
  govId?: MultiSizePhoto;
  workIdIsPrivate?: boolean;
  govIdIsPrivate?: boolean;
}

export type Language = "ENGLISH" | "BANGLA" | "HINDI";

export type IdentityType = "OWNER" | "TENANT";

interface IdentityData {
  email: string;
  type: IdentityType;
  firstName: string;
  lastName: string;
  displayName: string;
  mobile: string;
  language: Language;
  profilePhotos: MultiSizePhoto;
  identityPhotos: IdentityPhotos;
  createdOn: string;
  lastModifiedOn: string;
  ttl: string;
}

type IdentityNetworkType = Partial<IdentityData>;

export default IdentityNetworkType;
