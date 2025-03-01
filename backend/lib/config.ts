if (!process.env.FIREBASE_PROJECT_ID) throw new Error(".env FIREBASE_PROJECT_ID undefined");
if (!process.env.API_SERVER_ORIGIN) throw new Error(".env API_SERVER_ORIGIN undefined");
if (!process.env.NEXT_PUBLIC_VERCEL_ENV) throw new Error(".env NEXT_PUBLIC_VERCEL_ENV undefined");
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) throw new Error(".env FIREBASE_SERVICE_ACCOUNT_KEY undefined");

export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "mess-booking-app-serverless";

export const API_SERVER_ORIGIN = process.env.API_SERVER_ORIGIN || "";

export const IS_PREVIEW =
  !/localhost|127\.0\.0\.1/i.test(window.location.href) && process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

export const FIREBASE_SERVICE_ACCOUNT_KEY = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "{}");

export class ApiPaths {
  static ACCOUNTS = `${API_SERVER_ORIGIN}/api/accounts`;
  static BOOKINGS = `${API_SERVER_ORIGIN}/api/bookings`;
  static ID_DOCS = `${API_SERVER_ORIGIN}/api/identityDocs`;
  static PROFILE = `${API_SERVER_ORIGIN}/api/profile`;
  static ROOMS = `${API_SERVER_ORIGIN}/api/rooms`;
}
