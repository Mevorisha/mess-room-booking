import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  FirebaseAuth,
  RtDbPaths,
  StoragePaths,
} from "../modules/firebase/init.js";
import {
  EmailPasswdAuth,
  LinkMobileNumber,
  logOut as fbAuthLogOut,
  onAuthStateChanged,
  updateProfile as updateAuthProfile,
} from "../modules/firebase/auth.js";
import { fbRtdbUpdate, onDbContentChange } from "../modules/firebase/db.js";
import {
  fbStorageModFilename,
  fbStorageUpload,
} from "../modules/firebase/storage.js";
import { isEmpty } from "../modules/util/validations.js";
import { resizeImageBlob } from "../modules/util/dataConversion.js";
import useNotification from "../hooks/notification.js";

const MODULE_NAME = "contexts/auth.js";

/* -------------------------------------- CONSTANTS ----------------------------------- */

export const PROFILE_PHOTO_SIZES = {
  small: { w: 30, h: 30 },
  medium: { w: 90, h: 90 },
  large: { w: 500, h: 500 },
};

/* -------------------------------------- ENUMS ----------------------------------- */

/**
 * @enum {"STILL_LOADING" | "NOT_LOGGED_IN" | "LOGGED_IN"}
 */
export const AuthStateEnum = {
  STILL_LOADING: /** @type {"STILL_LOADING"} */ ("STILL_LOADING"),
  NOT_LOGGED_IN: /** @type {"NOT_LOGGED_IN"} */ ("NOT_LOGGED_IN"),
  LOGGED_IN: /**     @type {"LOGGED_IN"}     */ ("LOGGED_IN"),
};

/**
 * @enum {"type" | "photoURL" | "mobile" | "firstName" | "lastName"}
 */
export const UserDetailsEnum = {
  type: /**      @type {"type"}      */ ("type"),
  photoURL: /**  @type {"photoURL"}  */ ("photoURL"),
  mobile: /**    @type {"mobile"}    */ ("mobile"),
  firstName: /** @type {"firstName"} */ ("firstName"),
  lastName: /**  @type {"lastName"}  */ ("lastName"),
};

/* -------------------------------------- USER CLASS ----------------------------------- */

/**
 * @class
 * @property {string} uid
 * @property {string} photoURL
 * @property {string} mobile
 * @property {string} firstName
 * @property {string} lastName
 * @property {"EMPTY" | "TENANT" | "OWNER"} type
 * @method setType
 */
export class User {
  /**
   * The type is set to "EMPTY" by default.
   * Type is not included in the constructor because it is not available in Firebase Auth User object.
   * It is to be set using the setType method after the user details are fetched from the database.
   * @param {string} uid
   * @param {string} mobile
   * @param {string} firstName
   * @param {string} lastName
   */
  constructor(uid, mobile = "", firstName = "", lastName = "") {
    this.uid = uid;
    this.mobile = mobile;
    this.firstName = firstName;
    this.lastName = lastName;
    this.photoURLs =
      /** @type {{small: string, medium: string, large: string} | null} */ (
        null
      );
    this.type = /** @type {"EMPTY" | "TENANT" | "OWNER"} */ ("EMPTY");
  }

  /**
   * @returns {User}
   */
  static empty() {
    return new User("");
  }

  /**
   * Extracts user details from Firebase Auth User object.
   * @param {import("firebase/auth").User} user
   * @returns {User}
   */
  static fromFirebaseAuthUser(user) {
    return new User(
      user.uid,
      user.phoneNumber ?? "",
      user.displayName?.split(" ")[0] ?? "",
      user.displayName?.split(" ")[1] ?? ""
    );
  }

  /**
   * Loads the current user from Firebase Auth.
   * @returns {User}
   */
  static loadCurrentUser() {
    const authUser = FirebaseAuth.currentUser;
    if (!authUser) return User.empty();
    return User.fromFirebaseAuthUser(authUser);
  }

  /**
   * @returns {boolean}
   */
  isNotEmpty() {
    return this.uid !== "";
  }

  /**
   * @returns {User}
   */
  clone() {
    const user = new User(this.uid, this.mobile, this.firstName, this.lastName);
    if (!isEmpty(this.type))
      user.setType(/** @type {"TENANT" | "OWNER"} */ (this.type));

    if (!isEmpty(this.photoURLs))
      user.setPhotoURL(
        /** @type {{small: string, medium: string, large: string}} */ (
          this.photoURLs
        )
      );

    return user;
  }

  /**
   * Type does not exist on Firebase Auth User object.
   * Therefore, it is not included in the constructor.
   * @param {"TENANT" | "OWNER"} type
   * @returns {this}
   */
  setType(type) {
    this.type = type;
    return this;
  }

  /**
   * @param {{small: string, medium: string, large: string}} photoURLs
   * @returns {this}
   */
  setPhotoURL({ small, medium, large }) {
    this.photoURLs = { small, medium, large };
    return this;
  }

  /**
   * @param {string} firstName
   * @param {string} lastName
   * @returns {this}
   */
  setProfileName(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
    return this;
  }

  /**
   * @param {string} mobile
   * @returns {this}
   */
  setMobile(mobile) {
    this.mobile = mobile;
    return this;
  }

  /**
   * @returns {string}
   */
  toString() {
    return JSON.stringify(this, null, 2);
  }
}

/* ---------------------------------- AUTH CONTEXT OBJECT ----------------------------------- */

/**
 * @typedef {{
 *   type?: "TENANT" | "OWNER" | "EMPTY",
 *   photoURL?: string,
 *   mobile?: string,
 *   firstName?: string,
 *   lastName?: string
 * }} UserDetailsUpdatePayload
 *
 * @typedef {(uid: string, payload: UserDetailsUpdatePayload) => Promise<void>} FnUserDetailsUpdate
 *
 * @typedef  {Object} AuthContextType
 * @property {AuthStateEnum} state
 * @property {User} user
 * @property {(type: "TENANT" | "OWNER")              => Promise<void>} updateProfileType
 * @property {(image: File)                           => Promise<string>} updateProfilePhoto
 * @property {(firstName: string, lastName: string)   => Promise<void>} updateProfileName
 * @property {(number: string)                        => Promise<void>} sendPhoneVerificationCode
 * @property {(otp: string)                           => Promise<void>} verifyPhoneVerificationCode
 * @property {()                                      => Promise<void>} unlinkPhoneNumber
 * @property {()                                      => Promise<void>} requestPasswordReset
 * @property {()                                      => Promise<void>} logOut
 */

const AuthContext = createContext(
  /** @type {AuthContextType} */ ({
    state: AuthStateEnum.STILL_LOADING,
    user: User.empty(),
    updateProfileType: async () => {},
    updateProfilePhoto: async () => "",
    updateProfileName: async () => {},
    sendPhoneVerificationCode: async () => {},
    verifyPhoneVerificationCode: async () => {},
    unlinkPhoneNumber: async () => {},
    requestPasswordReset: async () => {},
    logOut: async () => {},
  })
);

export default AuthContext;

/* ------------------------------------ AUTH PROVIDER COMPONENT ----------------------------------- */

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(
    /** @type {AuthStateEnum} */ (AuthStateEnum.STILL_LOADING)
  );
  const [finalUser, setFinalUser] = useState(User.loadCurrentUser());

  const notify = useNotification();

  /* A bit of knowledge for my future confused self:
   * useEffect is a hook that runs with following conditions:
   *     - the first time the component is rendered
   *     - when one of the dependencies changes
   * By this logic, useEffect should run only once, right? But in dev mode,
   * useEffect runs twice. This is documented in the following link:
   *     https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development
   *     Docs guarantee that useEffect will run once in production mode so :shrug:
   * On the first run, an auth listener is started.
   * On the 2nd run, a new auth listener is started. So the unsubscribe function
   * of the first listener is returned from useEffect as a cleanup function.
   * This stops the first listener and keeps only the 2nd listener active.
   */

  /* ------------------------------------ USE EFFECTS AUTH STATE LISTENER ----------------------------------- */

  /* listen for auth state changes and update the temporary user */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      if (null == user) setAuthState(AuthStateEnum.NOT_LOGGED_IN);
      else {
        setFinalUser(User.fromFirebaseAuthUser(user));
        /* mark as still loading as type and identity details are yet to be fetched from rtdb */
        setAuthState(AuthStateEnum.STILL_LOADING);
      }

      console.log(
        `${MODULE_NAME}::onAuthStateChanged: new user =`,
        user ? User.fromFirebaseAuthUser(user) : null
      );

      if (null == user) notify("You are not logged in", "warning");
    });

    return () => unsubscribe();
  }, [notify]);

  /* --------------------------------------- USE EFFECTS RTDB LISTENER ----------------------------------- */

  /* listen for changes at rtdb at RtDbPaths.IDENTITY/user.uid/ if temp user is updated
   * and update the final user with additional data from rtdb */
  useEffect(() => {
    if (!finalUser.uid) return;
    if (authState === AuthStateEnum.NOT_LOGGED_IN) return;

    const unsubscribe = onDbContentChange(
      RtDbPaths.IDENTITY,
      `${finalUser.uid}/`,
      (data) => {
        console.log(`${MODULE_NAME}::onDbContentChange: new data =`, data);

        if (!data) {
          setFinalUser(User.loadCurrentUser());
          setAuthState(AuthStateEnum.LOGGED_IN);
          return;
        }

        setFinalUser(() => {
          const newUser = User.loadCurrentUser();
          if (!isEmpty(data.type)) newUser.setType(data.type);
          if (!isEmpty(data.photoURLs)) newUser.setPhotoURL(data.photoURLs);
          /* following are not updated here as these are set by onAuthStateChanged */
          // if (data.photoURL) newUser.photoURL = data.photoURL;
          // if (data.mobile) newUser.mobile = data.mobile;
          // if (data.firstName) newUser.firstName = data.firstName;
          // if (data.lastName) newUser.lastName = data.lastName;
          return newUser;
        });

        setAuthState(AuthStateEnum.LOGGED_IN);
      }
    );

    return () => unsubscribe();
  }, [authState, finalUser.uid, setFinalUser]);

  /* ------------------------------------ AUTH CONTEXT PROVIDER API FN ----------------------------------- */

  const updateProfileType = useCallback(
    /**
     * @param {"TENANT" | "OWNER"} type
     * @returns {Promise<void>}
     */
    async (type) =>
      fbRtdbUpdate(RtDbPaths.IDENTITY, `${finalUser.uid}/`, { type })
        .then(() => setFinalUser((user) => user.clone().setType(type)))
        .then(() => notify("Profile type updated successfully", "success")),
    [finalUser.uid, notify]
  );

  const updateProfilePhoto = useCallback(
    /**
     * @param {File} image
     * @returns {Promise<string>}
     */
    async (image) => {
      /* --------------------- SMALL PHOTO --------------------- */
      const smallfilename = fbStorageModFilename(
        finalUser.uid,
        PROFILE_PHOTO_SIZES.small.w.toString(),
        PROFILE_PHOTO_SIZES.small.h.toString()
      );
      const smallimg = await resizeImageBlob(
        image,
        PROFILE_PHOTO_SIZES.small.w,
        PROFILE_PHOTO_SIZES.small.h,
        image.type
      );
      const small = await fbStorageUpload(
        StoragePaths.PROFILE_PHOTOS,
        smallfilename,
        smallimg
      )
        .fbStorageMonitorUpload((percent) => {
          notify(`Uploading profile photo... ${percent.toFixed(2)}%`, "info");
        })
        .fbStorageGetURL();

      /* --------------------- MEDIUM PHOTO --------------------- */
      const medfilename = fbStorageModFilename(
        finalUser.uid,
        PROFILE_PHOTO_SIZES.medium.w.toString(),
        PROFILE_PHOTO_SIZES.medium.h.toString()
      );
      const mediumimg = await resizeImageBlob(
        image,
        PROFILE_PHOTO_SIZES.medium.w,
        PROFILE_PHOTO_SIZES.medium.h,
        image.type
      );
      const medium = await fbStorageUpload(
        StoragePaths.PROFILE_PHOTOS,
        medfilename,
        mediumimg
      )
        .fbStorageMonitorUpload((percent) => {
          notify(`Uploading profile photo... ${percent.toFixed(2)}%`, "info");
        })
        .fbStorageGetURL();

      /* --------------------- LARGE PHOTO --------------------- */
      const largefilename = fbStorageModFilename(
        finalUser.uid,
        PROFILE_PHOTO_SIZES.large.w.toString(),
        PROFILE_PHOTO_SIZES.large.h.toString()
      );
      const largeimg = await resizeImageBlob(
        image,
        PROFILE_PHOTO_SIZES.large.w,
        PROFILE_PHOTO_SIZES.large.h,
        image.type
      );
      const large = await fbStorageUpload(
        StoragePaths.PROFILE_PHOTOS,
        largefilename,
        largeimg
      )
        .fbStorageMonitorUpload((percent) => {
          notify(`Uploading profile photo... ${percent.toFixed(2)}%`, "info");
        })
        .fbStorageGetURL();

      // update auth profile
      await updateAuthProfile({ photoURL: medium });
      await fbRtdbUpdate(RtDbPaths.IDENTITY, `${finalUser.uid}/`, {
        photoURLs: { small, medium, large },
      });
      setFinalUser((user) =>
        user.clone().setPhotoURL({ small, medium, large })
      );

      notify("Profile photo updated successfully", "success");

      return medium;
    },
    [finalUser.uid, notify]
  );

  const updateProfileName = useCallback(
    /**
     * @param {string} firstName
     * @param {string} lastName
     * @returns {Promise<void>}
     */
    async (firstName, lastName) =>
      updateAuthProfile({ firstName, lastName })
        .then(() =>
          setFinalUser((user) =>
            user.clone().setProfileName(firstName, lastName)
          )
        )
        .then(() => notify("Profile name updated successfully", "success")),
    [notify]
  );

  const sendPhoneVerificationCode = useCallback(
    /** @param {string} number
     * @returns {Promise<void>}
     */
    async (number) =>
      LinkMobileNumber.sendOtp(number).then(() =>
        notify("Check your mobile for OTP", "info")
      ),
    [notify]
  );

  const verifyPhoneVerificationCode = useCallback(
    /**
     * @param {string} otp
     * @returns {Promise<void>}
     */
    async (otp) =>
      LinkMobileNumber.verifyOtp(otp)
        .then((phno) =>
          isEmpty(phno)
            ? Promise.reject("Mobile number verification failed")
            : Promise.resolve(phno)
        )
        .catch(async (error) => {
          if (
            !(
              error.toString().toLowerCase().includes("provider") &&
              error.toString().toLowerCase().includes("already") &&
              error.toString().toLowerCase().includes("linked")
            )
          ) {
            return Promise.reject(error);
          }
          notify("Unlinking existing mobile number", "info");
          await LinkMobileNumber.unlinkPhoneNumber();
          notify("Verifying new mobile number", "info");
          return LinkMobileNumber.verifyOtp(otp);
        })
        .then((phno) => setFinalUser((user) => user.clone().setMobile(phno)))
        .then(() => notify("Mobile number verified successfully", "success")),

    [notify]
  );

  const unlinkPhoneNumber = useCallback(
    /**
     * @returns {Promise<void>}
     */
    async () =>
      LinkMobileNumber.unlinkPhoneNumber()
        .then(() => setFinalUser((user) => user.clone().setMobile("")))
        .then(() => notify("Mobile number unlinked successfully", "success")),
    [notify]
  );

  const requestPasswordReset = useCallback(
    /**
     * @returns {Promise<void>}
     */
    async () =>
      EmailPasswdAuth.requestPasswordReset().then(() =>
        notify("Check your email for password reset link", "info")
      ),
    [notify]
  );

  const logOut = useCallback(
    /**
     * @returns {Promise<void>}
     */
    () =>
      fbAuthLogOut()
        .then(() => notify("Logged out", "info"))
        .then(() => setFinalUser(User.empty())),
    [notify]
  );

  return (
    <AuthContext.Provider
      value={{
        state: authState,
        user: finalUser,
        updateProfileType,
        updateProfilePhoto,
        updateProfileName,
        sendPhoneVerificationCode,
        verifyPhoneVerificationCode,
        unlinkPhoneNumber,
        requestPasswordReset,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
