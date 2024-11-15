import { FirebaseAuth } from "./init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  linkWithCredential,
  // updatePhoneNumber,
  sendPasswordResetEmail,
  unlink,
  updateProfile as fbAuthUpdateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  RecaptchaVerifier,
  PhoneAuthProvider,
} from "firebase/auth";
import { logError } from "./util.js";
import { getCleanFirebaseErrMsg } from "../errors/ErrorMessages.js";
import ErrorMessages from "../errors/ErrorMessages.js";

const AuthConstants = {
  RECAPTCHA_VERIFIER: "AUTH_RECAPTCHA_VERIFIER",
  CONFIRMATION_RESULT: "AUTH_OTP_CONFIRMATION_RESULT",
};

/**
 * @param {(uid: import("firebase/auth").User | null) => void} callback
 * @returns {import("firebase/auth").Unsubscribe}
 */
function onAuthStateChanged(callback) {
  const unsubscribe = FirebaseAuth.onAuthStateChanged((user) => {
    if (user) {
      localStorage.setItem("uid", user.uid);
      callback(user);
    } else {
      localStorage.removeItem("uid");
      callback(null);
    }
  });

  return unsubscribe;
}

/**
 *
 * @param {{
 *   firstName?: string;
 *   lastName?: string;
 *   photoURL?: string;
 * }} details
 */
async function updateProfile({ firstName, lastName, photoURL }) {
  const updatePayload = {};
  if (firstName && lastName) {
    updatePayload.displayName = `${firstName} ${lastName}`;
  } else if (firstName || lastName) {
    return Promise.reject("Both first name and last name are required.");
  }
  if (photoURL) {
    updatePayload.photoURL = photoURL;
  }
  if (!FirebaseAuth.currentUser) {
    return Promise.reject("No user logged in.");
  }
  try {
    await fbAuthUpdateProfile(FirebaseAuth.currentUser, updatePayload);
    return Promise.resolve();
  } catch (error) {
    const errmsg = getCleanFirebaseErrMsg(error);
    logError("auth_update_profile", errmsg, error.code);
    return Promise.reject(errmsg);
  }
}

/**
 * @returns {Promise<string>} A success message. Disregard the return value.
 */
async function logOut() {
  try {
    await signOut(FirebaseAuth);
    return Promise.resolve("Successfully logged out.");
  } catch (error) {
    const errmsg = getCleanFirebaseErrMsg(error);
    logError("auth_microsoft_logout", errmsg, error.code);
    return Promise.reject(errmsg);
  }
}

/**
 * @returns {RecaptchaVerifier}
 * @throws {Error} If RecaptchaVerifier is not properly initialized.
 */
function initializeRecaptcha() {
  if (window[AuthConstants.RECAPTCHA_VERIFIER])
    return window[AuthConstants.RECAPTCHA_VERIFIER];

  let recaptchaContainer = document.getElementById("recaptcha-container");
  recaptchaContainer = document.createElement("div");
  recaptchaContainer.id = "recaptcha-container";
  document.body.appendChild(recaptchaContainer);

  const recaptchaVerifier = new RecaptchaVerifier(
    FirebaseAuth,
    recaptchaContainer,
    {
      size: "invisible",
    }
  );

  return (window[AuthConstants.RECAPTCHA_VERIFIER] = recaptchaVerifier);
}

class LinkMobileNumber {
  /**
   * @param {string} phoneNumber
   * @returns {Promise<void>}
   */
  static async sendOtp(phoneNumber) {
    try {
      initializeRecaptcha();
      /**
       * @type {RecaptchaVerifier}
       */
      const recaptchaVerifier = window[AuthConstants.RECAPTCHA_VERIFIER];

      const confirmationResult = await signInWithPhoneNumber(
        FirebaseAuth,
        phoneNumber,
        recaptchaVerifier
      );
      window[AuthConstants.CONFIRMATION_RESULT] = confirmationResult;
      return Promise.resolve();
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_send_otp", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }

  /**
   * @param {string} otp
   * @returns {Promise<string>}
   */
  static async verifyOtp(otp) {
    /**
     * @type {import("firebase/auth").ConfirmationResult | null}
     */
    const confirmationResult = window[AuthConstants.CONFIRMATION_RESULT];
    if (!confirmationResult) {
      return Promise.reject("No OTP sent. Please request a new OTP.");
    }

    try {
      // create a PhoneAuthCredential with the OTP and verify it
      const phoneAuthCredential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        otp
      );

      if (!FirebaseAuth.currentUser) {
        return Promise.reject("No user logged in.");
      }

      // also updates the user's phone number so updatePhoneNumber is not required
      await linkWithCredential(FirebaseAuth.currentUser, phoneAuthCredential);

      // Optional: Update phone number in user's profile if linking is not required
      // await updatePhoneNumber(FirebaseAuth.currentUser, phoneAuthCredential);

      const phoneNumber = FirebaseAuth.currentUser.phoneNumber ?? "";
      console.log("Phone number linked:", phoneNumber);
      return Promise.resolve(phoneNumber);
    } catch (error) {
      let errmsg = getCleanFirebaseErrMsg(error);
      if (error?.code === "auth/account-exists-with-different-credential") {
        errmsg =
          "Phone number linked to an existing account. Use a different number.";
      }
      logError("auth_verify_otp", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }

  static async unlinkPhoneNumber() {
    try {
      if (!FirebaseAuth.currentUser) {
        return Promise.reject("No user logged in.");
      }

      await unlink(FirebaseAuth.currentUser, "phone");
      return Promise.resolve();
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_unlink_phone", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }
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
   * @param {string} email
   * @returns {Promise<void>}
   */
  static async requestPasswordReset(email = "") {
    if (!email && !FirebaseAuth.currentUser?.email) {
      return Promise.reject("No email provided.");
    }

    if (!email && FirebaseAuth.currentUser?.email) {
      email = FirebaseAuth.currentUser.email;
    }

    try {
      await sendPasswordResetEmail(FirebaseAuth, email);
      return Promise.resolve();
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      logError("auth_legacy_reset", errmsg, error.code);
      return Promise.reject(errmsg);
    }
  }
}

export {
  onAuthStateChanged,
  updateProfile,
  logOut,
  LinkMobileNumber,
  GoogleAuth,
  AppleAuth,
  MicrosoftAuth,
  EmailPasswdAuth,
};
