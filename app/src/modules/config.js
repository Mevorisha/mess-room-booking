if (!process.env.API_SERVER_ORIGIN) throw new Error(".env API_SERVER_ORIGIN undefined");

export const API_SERVER_ORIGIN = process.env.API_SERVER_ORIGIN || "localhost:5000";
/* eslint-disable-next-line no-restricted-globals */
self["API_SERVER_ORIGIN"] = API_SERVER_ORIGIN; // just coz

/* eslint-disable-next-line no-restricted-globals */
export const FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.FIREBASE_APPCHECK_DEBUG_TOKEN ?? undefined;
/* eslint-disable-next-line no-restricted-globals */
self["FIREBASE_APPCHECK_DEBUG_TOKEN"] = FIREBASE_APPCHECK_DEBUG_TOKEN;
