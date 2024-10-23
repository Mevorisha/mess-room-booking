// Import Firebase modules from CDN
import { initializeApp } from "firebase/app";
import { getDatabase, ref } from "firebase/database";
import { getAuth } from "firebase/auth";

// Firebase configuration (replace with your config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
const FirebaseApp = initializeApp(firebaseConfig);

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
}

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
  FirebaseRtDb,
  FirebaseAuth,
  RtDbPaths,
};
