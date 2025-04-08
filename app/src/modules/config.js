// Read all files from ../configs and set up the env variables

import prodApiServerUrl from "@/configs/API_SERVER_URL.js";

const IS_DEV = /localhost|127\.0\.0\.1|192.168/i.test(window.location.href);

const IS_PREVIEW =
  !IS_DEV &&
  window.location.hostname !== "mess-booking-app-serverless.web.app" &&
  window.location.hostname !== "mess-booking-app-serverless.firebaseapp.com";

const API_SERVER_URL = IS_DEV ? import.meta.env.VITE_API_SERVER_URL : prodApiServerUrl;
// /* eslint-disable-next-line no-restricted-globals */
self["API_SERVER_URL"] = API_SERVER_URL; // just coz

const FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
// /* eslint-disable-next-line no-restricted-globals */
self["FIREBASE_APPCHECK_DEBUG_TOKEN"] = FIREBASE_APPCHECK_DEBUG_TOKEN;

export { API_SERVER_URL, FIREBASE_APPCHECK_DEBUG_TOKEN, IS_DEV, IS_PREVIEW };
