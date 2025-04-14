// Import Firebase modules from CDN
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth /* connectAuthEmulator */ } from "firebase/auth";
import { getDatabase, ref as rtdbRef, connectDatabaseEmulator } from "firebase/database";
import { getStorage, ref as storageRef, connectStorageEmulator } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import * as config from "@/modules/config.js";

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

// Don't delete this line
// This line ensures FIREBASE_APPCHECK_DEBUG_TOKEN is in use in this file
// Which in turn ensures the config module is loaded
// Which in turn ensures self["FIREBASE_APPCHECK_DEBUG_TOKEN"] is set
// Which in turn is needed internally by firebase
if (config.FIREBASE_APPCHECK_DEBUG_TOKEN.length === 0) console.warn("App check token not found");

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

/**
 * Realtime Database paths
 */
class RtDbPaths {
  static IDENTITY = !config.IS_PREVIEW ? "/db_Identity" : "/preview_db_Identity";
  static LOGS = !config.IS_PREVIEW ? "/db_Logs" : "/preview_db_Logs";
  static FEEDBACK = !config.IS_PREVIEW ? "/db_Feedback" : "/preview_db_Feedback";
  static ROOMS = !config.IS_PREVIEW ? "/db_Rooms" : "/preview_db_Rooms";

  static Identity = (uid: string): string => `${RtDbPaths.IDENTITY}/${uid}`;
  static Logs = (): string => RtDbPaths.LOGS;
  static Feedback = (): string => RtDbPaths.FEEDBACK;
  static Rooms = (uid: string): string => `${RtDbPaths.ROOMS}/${uid}`;
}

/**
 * Storage paths
 */
class StoragePaths {
  static PROFILE_PHOTOS = !config.IS_PREVIEW ? "/storg_ProfilePhotos" : "/preview_storg_ProfilePhotos";
  static ROOM_PHOTOS = !config.IS_PREVIEW ? "/storg_RoomPhotos" : "/preview_storg_RoomPhotos";
  static IDENTITY_DOCUMENTS = !config.IS_PREVIEW ? "/storg_IdentityDocuments" : "/preview_storg_IdentityDocuments";
  static FEEDBACK_PHOTOS = !config.IS_PREVIEW ? "/storg_FeedbackPhotos" : "/preview_storg_FeedbackPhotos";

  static ProfilePhotos = (uid: string, w: number | string, h: number | string): string =>
    `${StoragePaths.PROFILE_PHOTOS}/${uid}/${w}/${h}`;
  static RoomPhotos = (uid: string, code: string): string => `${StoragePaths.ROOM_PHOTOS}/${uid}/${code}`;
  static IdentityDocuments = (
    uid: string,
    code: string | number,
    type: "WORK_ID" | "GOV_ID",
    w: number | string,
    h: number | string
  ): string => `${StoragePaths.IDENTITY_DOCUMENTS}/${uid}/${type}/${code}/${w}/${h}`;
  static FeedbackPhotos = (uid: string, code: string): string => `${StoragePaths.FEEDBACK_PHOTOS}/${uid}/${code}`;
}

/**Path
 * Get a reference to a path in the Realtime Database
 */
function fbRtdbGetRef(...args: string[]): import("firebase/database").DatabaseReference {
  const path = Array.from(args).join("/");
  return rtdbRef(FirebaseRtDb, path);
}

/**
 * Get a reference to a path in Firebase Storage
 */
function fbStorageGetRef(...args: string[]): import("firebase/storage").StorageReference {
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
