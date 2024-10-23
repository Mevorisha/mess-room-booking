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
import ErrorMessages from "../errors/ErrorMessages.js";

/**
 * @returns {Promise<string>} The user's unique UID if logged in, or null if not logged in.
 */
async function isLoggedIn() {
  return new Promise((resolve, reject) => {
    const unsubscribe = FirebaseAuth.onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        resolve(user.uid);
      } else {
        reject(ErrorMessages.USER_NOT_LOGGED_IN);
      }
    });
  });
}

{
  // call is logged in function and set to local storage
  isLoggedIn().then((uid) => {
    localStorage.setItem("uid", uid);
  });
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
      logError("auth_google_login", ErrorMessages.LOGIN_FAILED, error.code);
      return Promise.reject(ErrorMessages.LOGIN_FAILED);
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
      logError("auth_google_logout", ErrorMessages.LOGOUT_FAILED, error.code);
      return Promise.reject(ErrorMessages.LOGOUT_FAILED);
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
      logError("auth_apple_login", ErrorMessages.LOGIN_FAILED, error.code);
      return Promise.reject(ErrorMessages.LOGIN_FAILED);
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
      logError("auth_apple_logout", ErrorMessages.LOGOUT_FAILED, error.code);
      return Promise.reject(ErrorMessages.LOGOUT_FAILED);
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
      logError("auth_microsoft_login", ErrorMessages.LOGIN_FAILED, error.code);
      return Promise.reject(ErrorMessages.LOGIN_FAILED);
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
      logError(
        "auth_microsoft_logout",
        ErrorMessages.LOGOUT_FAILED,
        error.code
      );
      return Promise.reject(ErrorMessages.LOGOUT_FAILED);
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
      logError(
        "auth_legacy_register",
        ErrorMessages.REGISTRATION_FAILED,
        error.code
      );
      return Promise.reject(ErrorMessages.REGISTRATION_FAILED);
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
      logError("auth_legacy_login", ErrorMessages.LOGIN_FAILED, error.code);
      return Promise.reject(ErrorMessages.LOGIN_FAILED);
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
      logError("auth_legacy_logout", ErrorMessages.LOGOUT_FAILED, error.code);
      return Promise.reject(ErrorMessages.LOGOUT_FAILED);
    }
  }
}

export { isLoggedIn, GoogleAuth, AppleAuth, MicrosoftAuth, EmailPasswdAuth };
