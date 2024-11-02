// Import Firebase modules from CDN
import { initializeApp, } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getDatabase, ref as rtdbRef, connectDatabaseEmulator } from "firebase/database";
import { getStorage, ref as storageRef, connectStorageEmulator } from "firebase/storage";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Firebase configuration (replace with your config)
const firebaseConfig = {
  apiKey: "AIzaSyDMw-9Ha6Uu_LwHtgJsk198fOQCqe-FKbc",
  authDomain: "mess-booking-app-serverless.firebaseapp.com",
  databaseURL:
    "https://mess-booking-app-serverless-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mess-booking-app-serverless",
  storageBucket: "mess-booking-app-serverless.appspot.com",
  messagingSenderId: "239013390662",
  appId: "1:239013390662:web:4a28e268f5c2e1864a9d47",
  measurementId: "G-F2DZDEH13C",
};

// Initialize Firebase
const FirebaseApp = initializeApp(firebaseConfig);
const FirebaseAnalytics = getAnalytics(FirebaseApp);

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
 * @enum {"/db_ProviderProfile" | "/db_TenantProfile" | "/db_Identity" | "/db_Logs" | "/db_Feedback" | "/db_Notification"}
 */
const RtDbPaths = {
  PROVIDER_PROFILE: /** @type {"/db_ProviderProfile"} */ (
    "/db_ProviderProfile"
  ),
  TENANT_PROFILE: /** @type {"/db_TenantProfile"} */ ("/db_TenantProfile"),
  IDENTITY: /** @type {"/db_Identity"} */ ("/db_Identity"),
  LOGS: /** @type {"/db_Logs"} */ ("/db_Logs"),
  FEEDBACK: /** @type {"/db_Feedback"} */ ("/db_Feedback"),
  NOTIFICATION: /** @type {"/db_Notification"} */ ("/db_Notification"),
};

/**
 * Storage paths
 * @enum {"/storg_ProfilePhotos" | "/storg_MessPhotos" | "/storg_IdentityDocuments" | "/storg_FeedbackPhotos"}
 */
const StoragePaths = {
  PROFILE_PHOTOS: /** @type {"/storg_ProfilePhotos"} */ (
    "/storg_ProfilePhotos"
  ),
  MESS_PHOTOS: /** @type {"/storg_MessPhotos"} */ ("/storg_MessPhotos"),
  IDENTITY_DOCUMENTS: /** @type {"/storg_IdentityDocuments"} */ (
    "/storg_IdentityDocuments"
  ),
  FEEDBACK_PHOTOS: /** @type {"/storg_FeedbackPhotos"} */ (
    "/storg_FeedbackPhotos"
  ),
};

/**Path
 * Get a reference to a path in the Realtime Database
 * @param {...string} args - Path segments to join
 * @returns {import("firebase/database").DatabaseReference}
 */
function fbRtdbGetRef() {
  // convert arguments keyword into an array
  const args = Array.from(arguments);
  const path = args.join("/");
  return rtdbRef(FirebaseRtDb, path);
}

function fbStorageGetRef() {
  const args = Array.from(arguments);
  const path = args.join("/");
  return storageRef(FirebaseStorage, path);
}

export {
  fbRtdbGetRef,
  fbStorageGetRef,
  FirebaseApp,
  FirebaseAnalytics,
  FirebaseRtDb,
  FirebaseAuth,
  FirebaseStorage,
  FirebaseFirestore,
  RtDbPaths,
  StoragePaths,
};
