// Import Firebase modules from CDN
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth /* connectAuthEmulator */ } from "firebase/auth";
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

// Firebase Auth
const FirebaseAuth = getAuth(FirebaseApp);

export { FirebaseApp, FirebaseAppCheck, FirebaseAnalytics, FirebaseAuth };
