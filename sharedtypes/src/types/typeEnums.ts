export enum ApiResponseUrlType {
  GS_PATH = "GS_PATH",
  API_URI = "API_URI",
}

export enum Language {
  ENGLISH = "ENGLISH",
  BANGLA = "BANGLA",
  HINDI = "HINDI",
}

export enum IdentityType {
  OWNER = "OWNER",
  TENANT = "TENANT",
}

export enum DocVisibility {
  PRIVATE = "PRIVATE",
  PUBLIC = "PUBLIC",
}

export enum DocType {
  WORK_ID = "WORK_ID",
  GOV_ID = "GOV_ID",
}

export enum AcceptGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum AcceptOccupation {
  STUDENT = "STUDENT",
  PROFESSIONAL = "PROFESSIONAL",
  ANY = "ANY",
}

export enum BookingStatus {
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  UNSET = "UNSET",
}

export enum RoomSortFields {
  CAPACITY = "capacity",
  RATING = "rating",
  PRICE_PER_OCCUPANT = "pricePerOccupant",
}

export enum QuerySortOrder {
  ASCENDING = "asc",
  DESCENDING = "desc",
}

export enum LogType {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export enum HeaderTypes {
  CONTENT_TYPE = "content-type",
  X_FIREBASE_TOKEN = "x-firebase-token",
  X_CONTENT_ENCODING = "x-content-encoding",
  X_DECODED_CONTENT_TYPE = "x-decoded-content-type",
  ACCESS_CONTROL_ALLOW_ORIGIN = "access-control-allow-origin",
  ACCESS_CONTROL_ALLOW_METHODS = "access-control-allow-methods",
  ACCESS_CONTROL_ALLOW_HEADERS = "access-control-allow-headers",
  ACCESS_CONTROL_EXPOSE_HEADERS = "access-control-expose-headers",
  ACCESS_CONTROL_ALLOW_CREDENTIALS = "access-control-allow-credentials",
}

export enum HttpMethodTypes {
  POST = "POST",
  GET = "GET",
  PATCH = "PATCH",
  DELETE = "DELETE",
}
