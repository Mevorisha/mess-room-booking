import "dotenv/config";

if (!process.env["ENVIRONMENT_TYPE"]) throw new Error(".env ENVIRONMENT_TYPE undefined");
if (!process.env["API_SERVER_ORIGIN"]) throw new Error(".env API_SERVER_ORIGIN undefined");
if (!process.env["WEB_SERVER_ORIGIN"]) throw new Error(".env WEB_SERVER_ORIGIN undefined");
if (!process.env["CORS_ALLOWED_ORIGINS"]) throw new Error(".env CORS_ALLOWED_ORIGINS undefined");
if (!process.env["CORS_ALLOW_EVERYTHING"]) throw new Error(".env CORS_ALLOW_EVERYTHING undefined");
if (!process.env["FIREBASE_PROJECT_ID"]) throw new Error(".env FIREBASE_PROJECT_ID undefined");
if (!process.env["FIREBASE_SERVICE_ACCOUNT_KEY"]) throw new Error(".env FIREBASE_SERVICE_ACCOUNT_KEY undefined");
if (!process.env["FIREBASE_DATABASE_URL"]) throw Error(".env FIREBASE_DATABASE_URL undefined");
if (!process.env["FIREBASE_STORAGE_BUCKET"]) throw Error(".env FIREBASE_STORAGE_BUCKET undefined");
if (!process.env["FIREBASE_EMULATOR_DATABASE_URL"]) throw Error(".env FIREBASE_EMULATOR_DATABASE_URL undefined");
if (!process.env["FIREBASE_EMULATOR_STORAGE_BUCKET"]) throw Error(".env FIREBASE_EMULATOR_STORAGE_BUCKET undefined");
if (!process.env["REDIS_URL"]) throw Error(".env REDIS_URL undefined");

// if (!process.env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error(".env FIREBASE_STORAGE_EMULATOR_HOST undefined");
// if (!process.env.FIREBASE_FIRESTORE_EMULATOR_HOST) throw new Error(".env FIREBASE_FIRESTORE_EMULATOR_HOST undefined");

export const FIREBASE_PROJECT_ID = process.env["FIREBASE_PROJECT_ID"] || "mess-booking-app-serverless";

export const API_SERVER_ORIGIN = process.env["API_SERVER_ORIGIN"] || "";

export const WEB_SERVER_ORIGIN = process.env["WEB_SERVER_ORIGIN"] || "";

export const CORS_ALLOWED_ORIGINS = JSON.parse(process.env["CORS_ALLOWED_ORIGINS"] || "[]") as string[];
CORS_ALLOWED_ORIGINS.push(API_SERVER_ORIGIN);
CORS_ALLOWED_ORIGINS.push(WEB_SERVER_ORIGIN);

export const CORS_ALLOW_EVERYTHING = process.env["CORS_ALLOW_EVERYTHING"] === "true";

export const IS_DEV = ["dev", "devnoemu"].includes(process.env["ENVIRONMENT_TYPE"]);
export const RUN_ON_EMULATOR = /localhost|127\.0\.0\.1|192.168/i.test(API_SERVER_ORIGIN) && "devnoemu" !== process.env["ENVIRONMENT_TYPE"];

export const FIREBASE_SERVICE_ACCOUNT_KEY: object = JSON.parse(process.env["FIREBASE_SERVICE_ACCOUNT_KEY"] ?? "{}");

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
