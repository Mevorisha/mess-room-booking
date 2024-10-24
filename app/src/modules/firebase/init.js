// Import Firebase modules from CDN
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref } from "firebase/database";
import { getAuth } from "firebase/auth";

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

/**
 * Realtime Database paths
 * @enum {string}
 */
const RtDbPaths = {
  PROVIDER_PROFILE: "/db.ProviderProfile",
  TENANT_PROFILE: "/db.TenantProfile",
  IDENTITY: "/db.Identity",
  LOGS: "/db.Logs",
  FEEDBACK: "/db.Feedback",
  NOTIFICATION: "/db.Notification",
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
  return ref(FirebaseRtDb, path);
}

export {
  fbRtdbGetRef,
  FirebaseApp,
  FirebaseAnalytics,
  FirebaseRtDb,
  FirebaseAuth,
  RtDbPaths,
};
