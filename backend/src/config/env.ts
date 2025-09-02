import "dotenv/config";

if (process.env["ENVIRONMENT_TYPE"] == null) throw new Error(".env ENVIRONMENT_TYPE undefined");
if (process.env["API_SERVER_ORIGIN"] == null) throw new Error(".env API_SERVER_ORIGIN undefined");
if (process.env["WEB_SERVER_ORIGIN"] == null) throw new Error(".env WEB_SERVER_ORIGIN undefined");
if (process.env["ALLOWED_ORIGINS"] == null) throw new Error(".env ALLOWED_ORIGINS undefined");
if (process.env["ALLOW_ANY_ORIGIN"] == null) throw new Error(".env ALLOW_ANY_ORIGIN undefined");
if (process.env["FIREBASE_PROJECT_ID"] == null) throw new Error(".env FIREBASE_PROJECT_ID undefined");
if (process.env["FIREBASE_SERVICE_ACCOUNT_KEY"] == null) throw new Error(".env FIREBASE_SERVICE_ACCOUNT_KEY undefined");
if (process.env["CUSTOM_FIRESTORE_INDEX_ADMIN_SERVICE_ACCOUNT_KEY"] == null) throw Error(".env CUSTOM_FIRESTORE_INDEX_ADMIN_SERVICE_ACCOUNT_KEY undefined"); // prettier-ignore
if (process.env["FIREBASE_DATABASE_URL"] == null) throw Error(".env FIREBASE_DATABASE_URL undefined");
if (process.env["FIREBASE_STORAGE_BUCKET"] == null) throw Error(".env FIREBASE_STORAGE_BUCKET undefined");
if (process.env["FIREBASE_EMULATOR_DATABASE_URL"] == null) throw Error(".env FIREBASE_EMULATOR_DATABASE_URL undefined");
if (process.env["FIREBASE_EMULATOR_STORAGE_BUCKET"] == null)
  throw Error(".env FIREBASE_EMULATOR_STORAGE_BUCKET undefined");
if (process.env["REDIS_URL"] == null) throw Error(".env REDIS_URL undefined");

// if (!process.env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error(".env FIREBASE_STORAGE_EMULATOR_HOST undefined");
// if (!process.env.FIREBASE_FIRESTORE_EMULATOR_HOST) throw new Error(".env FIREBASE_FIRESTORE_EMULATOR_HOST undefined");

export const FIREBASE_PROJECT_ID =
  process.env["FIREBASE_PROJECT_ID"].length == 0 ? "mess-booking-app-serverless" : process.env["FIREBASE_PROJECT_ID"];

// vercel provide env info
export const VERCEL_ENV = process.env["VERCEL_ENV"] ?? "development";
export const VERCEL_URL = process.env["VERCEL_URL"];

export const API_SERVER_ORIGIN =
  VERCEL_ENV === "preview" && VERCEL_URL != null ? `https://${VERCEL_URL}` : process.env["API_SERVER_ORIGIN"];

export const WEB_SERVER_ORIGIN = process.env["WEB_SERVER_ORIGIN"];

export const ALLOWED_ORIGINS = JSON.parse(
  process.env["ALLOWED_ORIGINS"].length == 0 ? "[]" : process.env["ALLOWED_ORIGINS"]
) as string[];

ALLOWED_ORIGINS.push(API_SERVER_ORIGIN);
ALLOWED_ORIGINS.push(WEB_SERVER_ORIGIN);

export const ALLOW_ANY_ORIGIN = process.env["ALLOW_ANY_ORIGIN"] === "true";

// custom env info
const ValidCustomEnvTypes = ["dev", "devnoemu"];

export const IS_DEV = ValidCustomEnvTypes.includes(process.env["ENVIRONMENT_TYPE"]) || VERCEL_ENV === "development";
export const IS_PREVIEW = VERCEL_ENV === "preview";
export const IS_DEV_OR_PREVIEW = IS_DEV || IS_PREVIEW;

export const RUN_ON_EMULATOR =
  /localhost|127\.0\.0\.1|192\.168/i.test(API_SERVER_ORIGIN) && "devnoemu" !== process.env["ENVIRONMENT_TYPE"];

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const FIREBASE_SERVICE_ACCOUNT_KEY: object = JSON.parse(process.env["FIREBASE_SERVICE_ACCOUNT_KEY"] ?? "{}");

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const CUSTOM_FIRESTORE_INDEX_ADMIN_SERVICE_ACCOUNT_KEY: object = JSON.parse(
  process.env["CUSTOM_FIRESTORE_INDEX_ADMIN_SERVICE_ACCOUNT_KEY"] ?? "{}"
);

export const FIREBASE_DATABASE_URL = process.env["FIREBASE_DATABASE_URL"];

export const FIREBASE_STORAGE_BUCKET = process.env["FIREBASE_STORAGE_BUCKET"];

export const FIREBASE_EMULATOR_DATABASE_URL = process.env["FIREBASE_EMULATOR_DATABASE_URL"];

export const FIREBASE_EMULATOR_STORAGE_BUCKET = process.env["FIREBASE_EMULATOR_STORAGE_BUCKET"];

export const FIREBASE_STORAGE_EMULATOR_HOST = process.env["FIREBASE_STORAGE_EMULATOR_HOST"] ?? "";
export const FIREBASE_FIRESTORE_EMULATOR_HOST = process.env["FIREBASE_FIRESTORE_EMULATOR_HOST"] ?? "";

export const REDIS_URL = process.env["REDIS_URL"];

export class ApiPaths {
  static ACCOUNTS = `${API_SERVER_ORIGIN}/api/accounts`;
  static BOOKINGS = `${API_SERVER_ORIGIN}/api/bookings`;
  static ID_DOCS = `${API_SERVER_ORIGIN}/api/identityDocs`;
  static PROFILE = `${API_SERVER_ORIGIN}/api/profile`;
  static ROOMS = `${API_SERVER_ORIGIN}/api/rooms`;
}
