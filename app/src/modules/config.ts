// Read all files from ../configs and set up the env variables

import prodApiServerUrl from "@/configs/API_SERVER_URL.js";

const IS_DEV = /localhost|127\.0\.0\.1|192\.168/i.test(window.location.href);
const IS_PREVIEW =
  !IS_DEV &&
  window.location.hostname !== "mess-booking-app-serverless.web.app" &&
  window.location.hostname !== "mess-booking-app-serverless.firebaseapp.com";

const API_SERVER_URL = IS_DEV ? (import.meta.env["VITE_API_SERVER_URL"] as string | null ?? "") : (prodApiServerUrl as string);
const FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env["VITE_FIREBASE_APPCHECK_DEBUG_TOKEN"] as string | null ?? "";

// @ts-expect-error: Assigning to self for global access in a non-standard environment
self["API_SERVER_URL"] = API_SERVER_URL; // just coz
// @ts-expect-error: Assigning to self for global access in a non-standard environment
self["FIREBASE_APPCHECK_DEBUG_TOKEN"] = FIREBASE_APPCHECK_DEBUG_TOKEN;

export { API_SERVER_URL, FIREBASE_APPCHECK_DEBUG_TOKEN, IS_DEV, IS_PREVIEW };
