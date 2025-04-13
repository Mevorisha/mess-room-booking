import { FirebaseAuth } from "./init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  linkWithCredential,
  sendPasswordResetEmail,
  unlink,
  updateProfile as fbAuthUpdateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  RecaptchaVerifier,
  PhoneAuthProvider,
  ConfirmationResult,
} from "firebase/auth";
import { logError } from "./util.js";
import { getCleanFirebaseErrMsg } from "@/modules/errors/ErrorMessages.js";
import ErrorMessages from "@/modules/errors/ErrorMessages.js";
import { lang } from "@/modules/util/language.js";
import { ApiPaths, apiPostOrPatchJson } from "@/modules/util/api.js";
import { AsyncLock } from "@/modules/util/asyncLock.js";

let RecaptchaVerifierObject: RecaptchaVerifier | null = null;
let RecaptchaVerifierConfirmationResult: ConfirmationResult | null = null;

export const AuthLock = {
  CREATING_USER: /** @type {AsyncLock} */ new AsyncLock(),
};

function onAuthStateChanged(
  callback: (uid: import("firebase/auth").User | null) => void
): import("firebase/auth").Unsubscribe {
  const unsubscribe = FirebaseAuth.onAuthStateChanged((user) => {
    if (user != null) {
      localStorage.setItem("uid", user.uid);
      callback(user);
    } else {
      localStorage.removeItem("uid");
      callback(null);
    }
  });

  return unsubscribe;
}

async function updateProfile({
  firstName,
  lastName,
  photoURL,
}: {
  firstName?: string;
  lastName?: string;
  photoURL?: string;
}): Promise<void> {
  const updatePayload: Record<string, string> = {};
  if (firstName != null && lastName != null) {
    updatePayload["displayName"] = `${firstName} ${lastName}`;
  } else if (firstName != null || lastName != null) {
    return Promise.reject(
      new Error(
        lang(
          "Both first name and last name are required.",
          "প্রথম নাম এবং শেষ নাম উভয় প্রয়োজন।",
          "पहला नाम और अंतिम नाम दोनों आवश्यक हैं।"
        )
      )
    );
  }
  if (photoURL != null) {
    updatePayload["photoURL"] = photoURL;
  }
  if (FirebaseAuth.currentUser == null) {
    return Promise.reject(
      new Error(lang("No user logged in.", "কোনও ব্যবহারকারী লগ ইন করেননি।", "कोई उपयोगकर्ता लॉगिन नहीं किये है।"))
    );
  }
  try {
    await fbAuthUpdateProfile(FirebaseAuth.currentUser, updatePayload);
    return Promise.resolve();
  } catch (e) {
    const error = e as Error & { code?: string };
    const errmsg = getCleanFirebaseErrMsg(error);
    await logError("auth_update_profile", errmsg, error.code);
    return Promise.reject(new Error(errmsg));
  }
}

async function logOut(): Promise<string> {
  try {
    await signOut(FirebaseAuth);
    return Promise.resolve(
      lang("Successfully logged out.", "সফলভাবে লগ আউট করা হয়েছে।", "सफलतापूर्वक लॉगआउट किया गया है।")
    );
  } catch (e) {
    const error = e as Error & { code?: string };
    const errmsg = getCleanFirebaseErrMsg(error);
    await logError("auth_microsoft_logout", errmsg, error.code);
    return Promise.reject(new Error(errmsg));
  }
}

/**
 * @throws {Error} If RecaptchaVerifier is not properly initialized.
 */
function initializeRecaptcha(): RecaptchaVerifier {
  if (RecaptchaVerifierObject != null) return RecaptchaVerifierObject;
  let recaptchaContainer = document.getElementById("recaptcha-container");
  recaptchaContainer = document.createElement("div");
  recaptchaContainer.id = "recaptcha-container";
  document.body.appendChild(recaptchaContainer);
  const recaptchaVerifier = new RecaptchaVerifier(FirebaseAuth, recaptchaContainer, { size: "invisible" });
  return (RecaptchaVerifierObject = recaptchaVerifier);
}

class LinkMobileNumber {
  static async sendOtp(phoneNumber: string): Promise<void> {
    try {
      initializeRecaptcha();
      if (RecaptchaVerifierObject == null) throw new Error("RecaptchaVerifierObject not intialized");
      const recaptchaVerifier: RecaptchaVerifier = RecaptchaVerifierObject;
      const confirmationResult = await signInWithPhoneNumber(FirebaseAuth, phoneNumber, recaptchaVerifier);
      RecaptchaVerifierConfirmationResult = confirmationResult;
      return Promise.resolve();
    } catch (e) {
      const error = e as Error & { code?: string };
      const errmsg = getCleanFirebaseErrMsg(error);
      await logError("auth_send_otp", errmsg, error.code);
      return Promise.reject(new Error(errmsg));
    }
  }

  static async verifyOtp(otp: string): Promise<string> {
    if (RecaptchaVerifierConfirmationResult == null) {
      return Promise.reject(
        new Error(
          lang(
            "No OTP sent. Please request a new OTP.",
            "কোনও ও-টি-পি পাঠানো হয়নি। অনুগ্রহ করে একটি নতুন ও-টি-পি অনুরোধ করুন।",
            "कोई ओ-टी-पी नहीं भेजा गया। कृपया एक नया ओ-टी-पी अनुरोध करें।"
          )
        )
      );
    }
    const confirmationResult = RecaptchaVerifierConfirmationResult;
    try {
      // create a PhoneAuthCredential with the OTP and verify it
      const phoneAuthCredential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
      if (FirebaseAuth.currentUser == null) {
        return Promise.reject(
          new Error(lang("No user logged in.", "কোনও ব্যবহারকারী লগ ইন করেননি।", "कोई उपयोगकर्ता लॉगिन नहीं किये है।"))
        );
      }
      // also updates the user's phone number so updatePhoneNumber is not required
      await linkWithCredential(FirebaseAuth.currentUser, phoneAuthCredential);
      // Optional: Update phone number in user's profile if linking is not required
      // await updatePhoneNumber(FirebaseAuth.currentUser, phoneAuthCredential);
      const phoneNumber = FirebaseAuth.currentUser.phoneNumber ?? "";
      console.log("Phone number linked:", phoneNumber);
      return Promise.resolve(phoneNumber);
    } catch (e) {
      const error = e as Error & { code?: string };
      let errmsg = getCleanFirebaseErrMsg(error);
      if (error.code === "auth/account-exists-with-different-credential") {
        errmsg = lang(
          "Phone number linked to an existing account. Use a different number.",
          "ফোন নম্বরটি যুক্ত অ্যাকাউন্ট বিদ্যমান। একটি ভিন্ন নম্বর ব্যবহার করুন।",
          "फोन नंबर एक मौजूदा अकाउंट से जुड़ा हुआ है। एक अलग नंबर का उपयोग करें।"
        );
      }
      await logError("auth_verify_otp", errmsg, error.code);
      return Promise.reject(new Error(errmsg));
    }
  }

  static async unlinkPhoneNumber(): Promise<void> {
    try {
      if (FirebaseAuth.currentUser == null) {
        return Promise.reject(
          new Error(lang("No user logged in.", "কোনও ব্যবহারকারী লগ ইন করেননি।", "कोई उपयोगकर्ता लॉगिन नहीं किये है।"))
        );
      }
      await unlink(FirebaseAuth.currentUser, "phone");
      return Promise.resolve();
    } catch (e) {
      const error = e as Error & { code?: string };
      const errmsg = getCleanFirebaseErrMsg(error);
      await logError("auth_unlink_phone", errmsg, error.code);
      return Promise.reject(new Error(errmsg));
    }
  }
}

class GoogleAuth {
  static googleProvider = new GoogleAuthProvider();

  /**
   * @deprecated Google sign-in does not support registration. Use GoogleAuth.login() instead.
   */
  static async register(): Promise<void> {
    await logError("auth_google_register", "Google sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED);
    throw new Error("Google sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED);
  }

  static async login(): Promise<string> {
    try {
      AuthLock.CREATING_USER = AsyncLock.create();
      const result = await signInWithPopup(FirebaseAuth, GoogleAuth.googleProvider);
      await apiPostOrPatchJson("POST", ApiPaths.Profile.create(), { email: result.user.email });
      AuthLock.CREATING_USER.clear();
      return Promise.resolve(result.user.uid);
    } catch (e) {
      const error = e as Error & { code?: string };
      const errmsg = getCleanFirebaseErrMsg(error);
      await logError("auth_google_login", errmsg, error.code);
      return Promise.reject(new Error(errmsg));
    }
  }
}

class AppleAuth {
  static appleProvider = new OAuthProvider("apple.com");

  /**
   * @deprecated Apple sign-in does not support registration. Use AppleAuth.login() instead.
   */
  static async register(): Promise<void> {
    await logError("auth_apple_register", "Apple sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED);
    throw new Error("Apple sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED);
  }

  static async login(): Promise<string> {
    try {
      AuthLock.CREATING_USER = AsyncLock.create();
      const result = await signInWithPopup(FirebaseAuth, AppleAuth.appleProvider);
      await apiPostOrPatchJson("POST", ApiPaths.Profile.create(), { email: result.user.email });
      AuthLock.CREATING_USER.clear();
      return Promise.resolve(result.user.uid);
    } catch (e) {
      const error = e as Error & { code?: string };
      const errmsg = getCleanFirebaseErrMsg(error);
      await logError("auth_apple_login", errmsg, error.code);
      return Promise.reject(new Error(errmsg));
    }
  }
}

class MicrosoftAuth {
  static microsoftProvider = new OAuthProvider("microsoft.com");

  /**
   * @deprecated Microsoft sign-in does not support registration. Use MicrosoftAuth.login() instead.
   */
  static async register(): Promise<void> {
    await logError("auth_microsoft_register", "Microsoft sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED);
    throw new Error("Microsoft sign-in: " + ErrorMessages.REGISTRATION_UNSUPPORTED);
  }

  static async login(): Promise<string> {
    try {
      AuthLock.CREATING_USER = AsyncLock.create();
      const result = await signInWithPopup(FirebaseAuth, MicrosoftAuth.microsoftProvider);
      await apiPostOrPatchJson("POST", ApiPaths.Profile.create(), { email: result.user.email });
      AuthLock.CREATING_USER.clear();
      return Promise.resolve(result.user.uid);
    } catch (e) {
      const error = e as Error & { code?: string };
      const errmsg = getCleanFirebaseErrMsg(error);
      await logError("auth_microsoft_login", errmsg, error.code);
      return Promise.reject(new Error(errmsg));
    }
  }
}

// Legacy (email) / Password Auth Wrapper
class EmailPasswdAuth {
  static async register(email: string, password: string): Promise<string> {
    try {
      AuthLock.CREATING_USER = AsyncLock.create();
      const result = await createUserWithEmailAndPassword(FirebaseAuth, email, password);
      await apiPostOrPatchJson("POST", ApiPaths.Profile.create(), { email: result.user.email });
      AuthLock.CREATING_USER.clear();
      return Promise.resolve(result.user.uid);
    } catch (e) {
      const error = e as Error & { code?: string };
      const errmsg = getCleanFirebaseErrMsg(error);
      await logError("auth_legacy_register", errmsg, error.code);
      return Promise.reject(new Error(errmsg));
    }
  }

  static async login(email: string, password: string): Promise<string> {
    try {
      AuthLock.CREATING_USER = AsyncLock.create();
      const result = await signInWithEmailAndPassword(FirebaseAuth, email, password);
      await apiPostOrPatchJson("POST", ApiPaths.Profile.create(), { email: result.user.email });
      AuthLock.CREATING_USER.clear();
      return Promise.resolve(result.user.uid);
    } catch (e) {
      const error = e as Error & { code?: string };
      const errmsg = getCleanFirebaseErrMsg(error);
      await logError("auth_legacy_login", errmsg, error.code);
      return Promise.reject(new Error(errmsg));
    }
  }

  static async requestPasswordReset(email = ""): Promise<void> {
    if (email.length === 0 && FirebaseAuth.currentUser?.email == null) {
      return Promise.reject(
        new Error(lang("No email provided.", "কোনও ইমেল প্রদান করা হয়নি।", "कोई ईमेल प्रदान नहीं किया गया।"))
      );
    }
    if (email.length === 0 && FirebaseAuth.currentUser?.email != null) {
      email = FirebaseAuth.currentUser.email;
    }
    try {
      await sendPasswordResetEmail(FirebaseAuth, email);
      return Promise.resolve();
    } catch (e) {
      const error = e as Error & { code?: string };
      const errmsg = getCleanFirebaseErrMsg(error);
      await logError("auth_legacy_register", errmsg, error.code);
      return Promise.reject(new Error(errmsg));
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
