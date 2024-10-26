import { FirebaseAuth } from "./init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
} from "firebase/auth";
import { logError } from "./util.js";
import ErrorMessages, {
  getCleanFirebaseErrMsg,
} from "../errors/ErrorMessages.js";

/**
 * @param {(uid: string | null) => void} callback
 * @returns {import("firebase/auth").Unsubscribe}
 */
function onAuthStateChanged(callback) {
  const unsubscribe = FirebaseAuth.onAuthStateChanged((user) => {
    if (user) {
      localStorage.setItem("uid", user.uid);
      callback(user.uid);
    } else {
      localStorage.removeItem("uid");
      callback(null);
    }
  });

  return unsubscribe;
}

class GoogleAuth {
  static googleProvider = new GoogleAuthProvider();

  /**
   * @deprecated Google sign-in does not support registration. Use GoogleAuth.login() instead.
   */
  static async register() {
    logError(
      "auth_google_register",
      "Google sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED
    );
    throw new Error(
      "Google sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED
    );
  }

  /**
   * @returns {Promise<string>} The user's unique UID. Use this as an identifier.
   */
  static async login() {
    try {
      const result = await signInWithPopup(
        FirebaseAuth,
        GoogleAuth.googleProvider
      );
      return Promise.resolve(result.user.uid);
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_google_login", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }

  /**
   * @returns {Promise<string>} A success message. Disregard the return value.
   */
  static async logout() {
    try {
      await signOut(FirebaseAuth);
      return Promise.resolve("Successfully logged out.");
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_google_logout", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }
}

class AppleAuth {
  static appleProvider = new OAuthProvider("apple.com");

  /**
   * @deprecated Apple sign-in does not support registration. Use AppleAuth.login() instead.
   */
  static async register() {
    logError(
      "auth_apple_register",
      "Apple sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED
    );
    throw new Error("Apple sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED);
  }

  /**
   * @returns {Promise<string>} The user's unique UID. Use this as an identifier.
   */
  static async login() {
    try {
      const result = await signInWithPopup(
        FirebaseAuth,
        AppleAuth.appleProvider
      );
      return Promise.resolve(result.user.uid);
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_apple_login", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }

  /**
   * @returns {Promise<string>} A success message. Disregard the return value.
   */
  static async logout() {
    try {
      await signOut(FirebaseAuth);
      return Promise.resolve("Successfully logged out.");
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_apple_logout", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }
}

class MicrosoftAuth {
  static microsoftProvider = new OAuthProvider("microsoft.com");

  /**
   * @deprecated Microsoft sign-in does not support registration. Use MicrosoftAuth.login() instead.
   */
  static async register() {
    logError(
      "auth_microsoft_register",
      "Microsoft sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED
    );
    throw new Error(
      "Microsoft sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED
    );
  }

  /**
   * @returns {Promise<string>} The user's unique UID. Use this as an identifier.
   */
  static async login() {
    try {
      const result = await signInWithPopup(
        FirebaseAuth,
        MicrosoftAuth.microsoftProvider
      );
      return Promise.resolve(result.user.uid);
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_microsoft_login", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }

  /**
   * @returns {Promise<string>} A success message. Disregard the return value.
   */
  static async logout() {
    try {
      await signOut(FirebaseAuth);
      return Promise.resolve("Successfully logged out.");
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_microsoft_logout", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }
}

// Legacy (email) / Password Auth Wrapper
class EmailPasswdAuth {
  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<string>} An identifier for the user.
   */
  static async register(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(
        FirebaseAuth,
        email,
        password
      );
      return Promise.resolve(result.user.uid);
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_legacy_register", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }

  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<string>} An identifier for the user.
   */
  static async login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(
        FirebaseAuth,
        email,
        password
      );
      return Promise.resolve(result.user.uid);
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_legacy_login", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }

  /**
   * @returns {Promise<string>} A success message. Disregard the return value.
   */
  static async logout() {
    try {
      await signOut(FirebaseAuth);
      return Promise.resolve("Successfully logged out.");
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_legacy_logout", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }
}

export {
  onAuthStateChanged,
  GoogleAuth,
  AppleAuth,
  MicrosoftAuth,
  EmailPasswdAuth,
};
