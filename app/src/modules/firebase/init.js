// Import Firebase modules from CDN
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth /* connectAuthEmulator */ } from "firebase/auth";
import { getDatabase, ref as rtdbRef, connectDatabaseEmulator } from "firebase/database";
import { getStorage, ref as storageRef, connectStorageEmulator } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import * as config from "../config.js";

// Firebase configuration (replace with your config)
const firebaseConfig = {
  apiKey: "AIzaSyDMw-9Ha6Uu_LwHtgJsk198fOQCqe-FKbc",
  authDomain: "mess-booking-app-serverless.firebaseapp.com",
  databaseURL: "https://mess-booking-app-serverless-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mess-booking-app-serverless",
  storageBucket: "mess-booking-app-serverless.appspot.com",
  messagingSenderId: "239013390662",
  appId: "1:239013390662:web:4a28e268f5c2e1864a9d47",
  measurementId: "G-F2DZDEH13C",
};

// Initialize Firebase
const FirebaseApp = initializeApp(firebaseConfig);
const FirebaseAnalytics = getAnalytics(FirebaseApp);

// App check
if (!FirebaseApp) {
  throw new Error("Firebase app not initialized");
}

// Don't delete this line
// This line ensures FIREBASE_APPCHECK_DEBUG_TOKEN is in use in this file
// Which in turn ensures the config module is loaded
// Which in turn ensures self["FIREBASE_APPCHECK_DEBUG_TOKEN"] is set
// Which in turn is needed internally by firebase
if (!config.FIREBASE_APPCHECK_DEBUG_TOKEN) console.warn("App check token not found");

const FirebaseAppCheck = initializeAppCheck(FirebaseApp, {
  provider: new ReCaptchaV3Provider("6LdQN3QqAAAAAPDv2BdhlmQl1rIa7r6lHbhQpSYM"),
  isTokenAutoRefreshEnabled: true,
});

/**
 * Rt stands for Realtime, Rt stands for ROOT.
 * Using this in code directly is like shooting your own foot.
 * Huzzah!
 */
const FirebaseRtDb = getDatabase(FirebaseApp);

// Firebase Auth
const FirebaseAuth = getAuth(FirebaseApp);

const FirebaseStorage = getStorage(FirebaseApp);

const FirebaseFirestore = getFirestore(FirebaseApp);

if (/localhost|127\.0\.0\.1/i.test(window.location.href)) {
  // auth disabled coz otp and captcha not working in emulator
  // auth at 9001, rtdb at 9002, storage at 9003, firestore at 9004
  // connectAuthEmulator(FirebaseAuth, "http://localhost:9001");
  connectDatabaseEmulator(FirebaseRtDb, "localhost", 9002);
  connectStorageEmulator(FirebaseStorage, "localhost", 9003);
  connectFirestoreEmulator(FirebaseFirestore, "localhost", 9004);
}

const IS_PREVIEW =
  !/localhost|127\.0\.0\.1/i.test(window.location.href) &&
  window.location.hostname !== "mess-booking-app-serverless.web.app" &&
  window.location.hostname !== "mess-booking-app-serverless.firebaseapp.com";

/**
 * Realtime Database paths
 */
class RtDbPaths {
  static IDENTITY = !IS_PREVIEW ? "/db_Identity" : "/preview_db_Identity";
  static LOGS = !IS_PREVIEW ? "/db_Logs" : "/preview_db_Logs";
  static FEEDBACK = !IS_PREVIEW ? "/db_Feedback" : "/preview_db_Feedback";
  static ROOMS = !IS_PREVIEW ? "/db_Rooms" : "/preview_db_Rooms";

  /**
   * @param {string} uid - Unique identifier for the user.
   * @returns {string} Constructed database path for the user's identity.
   */
  static Identity = (uid) => `${RtDbPaths.IDENTITY}/${uid}`;
  static Logs = () => RtDbPaths.LOGS;
  static Feedback = () => RtDbPaths.FEEDBACK;
  /**
   * @param {string} uid - Unique identifier for the user.
   * @returns {string} Constructed database path for the user's rooms.
   */
  static Rooms = (uid) => `${RtDbPaths.ROOMS}/${uid}`;
}

/**
 * Storage paths
 */
class StoragePaths {
  static PROFILE_PHOTOS = !IS_PREVIEW ? "/storg_ProfilePhotos" : "/preview_storg_ProfilePhotos";
  static ROOM_PHOTOS = !IS_PREVIEW ? "/storg_RoomPhotos" : "/preview_storg_RoomPhotos";
  static IDENTITY_DOCUMENTS = !IS_PREVIEW ? "/storg_IdentityDocuments" : "/preview_storg_IdentityDocuments";
  static FEEDBACK_PHOTOS = !IS_PREVIEW ? "/storg_FeedbackPhotos" : "/preview_storg_FeedbackPhotos";

  /**
   * @param {string} uid - Unique identifier for the user.
   * @param {number | string} w - Width of the image.
   * @param {number| string} h - Height of the image.
   * @returns {string} Constructed storage path for the user's profile photos.
   */
  static ProfilePhotos = (uid, w, h) => `${StoragePaths.PROFILE_PHOTOS}/${uid}/${w}/${h}`;
  /**
   * @param {string} uid - Unique identifier for the user.
   * @param {string} code - Unique identifier for the image. Set to "PUBLIC" if document is set public in app.
   * @returns {string} Constructed storage path for the user's mess photos.
   */
  static RoomPhotos = (uid, code) => `${StoragePaths.ROOM_PHOTOS}/${uid}/${code}`;
  /**
   * @param {string} uid - Unique identifier for the user.
   * @param {string | number} code - Unique identifier for the image. Set to "PUBLIC" if document is set public in app.
   * @param {"WORK_ID" | "GOV_ID"} type - Type of the image, either "WORK_ID" or "GOV_ID".
   * @param {number | string} w - Width of the image.
   * @param {number| string} h - Height of the image.
   * @returns {string} Constructed storage path for the user's identity documents.
   */
  static IdentityDocuments = (uid, code, type, w, h) =>
    `${StoragePaths.IDENTITY_DOCUMENTS}/${uid}/${type}/${code}/${w}/${h}`;
  /**
   * @param {string} uid - Unique identifier for the user.
   * @param {string} code - Unique identifier for the image. Set to "PUBLIC" if document is set public in app.
   * @returns {string} Constructed storage path for the user's feedback photos.
   */
  static FeedbackPhotos = (uid, code) => `${StoragePaths.FEEDBACK_PHOTOS}/${uid}/${code}`;
}

/**Path
 * Get a reference to a path in the Realtime Database
 * @param {...string} args - Path segments to join
 * @returns {import("firebase/database").DatabaseReference}
 */
function fbRtdbGetRef(...args) {
  const path = Array.from(args).join("/");
  return rtdbRef(FirebaseRtDb, path);
}

/**
 * Get a reference to a path in Firebase Storage
 * @param {...string} args - Path segments to join
 * @returns {import("firebase/storage").StorageReference}
 */
function fbStorageGetRef(...args) {
  const path = Array.from(args).join("/");
  return storageRef(FirebaseStorage, path);
}

export {
  fbRtdbGetRef,
  fbStorageGetRef,
  FirebaseApp,
  FirebaseAppCheck,
  FirebaseAnalytics,
  FirebaseRtDb,
  FirebaseAuth,
  FirebaseStorage,
  FirebaseFirestore,
  RtDbPaths,
  StoragePaths,
};
