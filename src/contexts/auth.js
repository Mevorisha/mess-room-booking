const MODULE_NAME = "contexts/auth.js";

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
  updateProfile,
} from "../modules/firebase/auth.js";
import { fbRtdbUpdate, onDbContentChange } from "../modules/firebase/db.js";
import { fbStorageUpload } from "../modules/firebase/storage.js";
import useNotification from "../hooks/notification.js";

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
   * @param {string} photoURL
   * @param {string} mobile
   * @param {string} firstName
   * @param {string} lastName
   */
  constructor(uid, photoURL = "", mobile = "", firstName = "", lastName = "") {
    this.uid = uid;
    this.photoURL = photoURL;
    this.mobile = mobile;
    this.firstName = firstName;
    this.lastName = lastName;
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
      user.photoURL ?? "",
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
    const user = new User(
      this.uid,
      this.photoURL,
      this.mobile,
      this.firstName,
      this.lastName
    );
    if (this.type !== "EMPTY") user.setType(this.type);
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
 * @property {FnUserDetailsUpdate} updateUserDetails
 * @property {(uid: string, keys: UserDetailsEnum[])  => Promise<void>} removeUserDetails
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
    updateUserDetails: async () => {},
    removeUserDetails: async () => {},
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

/* ------------------------------------ UPDATE MAJOR FN ----------------------------------- */

/**
 * @param {string} uid
 * @returns {Promise<void>}
 */
async function tiggerAuthDataRefresh(uid) {
  if (!uid) {
    console.error(`${MODULE_NAME}::tiggerAuthDataRefresh: uid =`, uid);
    return Promise.resolve();
  }

  const currentVal = Date.now();
  console.log(
    `${MODULE_NAME}::tiggerAuthDataRefresh: currentVal =`,
    currentVal
  );

  return await fbRtdbUpdate(RtDbPaths.IDENTITY, `${uid}/`, {
    refresh: "" + currentVal,
  });
}

/**
 * @param {string} uid
 * @param {UserDetailsUpdatePayload} payload
 * @returns {Promise<void>}
 */
async function updateUserDetails(
  uid,
  { type = "EMPTY", photoURL = "", mobile = "", firstName = "", lastName = "" }
) {
  if (!uid) {
    console.error(`${MODULE_NAME}::updateUserDetails: uid =`, uid);
    return Promise.resolve();
  }

  const payload = { type, photoURL, mobile, firstName, lastName };
  const updateKeys = Object.keys(payload).filter(
    (key) =>
      payload[key] !== "" && payload[key] !== undefined && payload[key] !== null
  );

  console.log(`${MODULE_NAME}::updateUserDetails: db updates = ${updateKeys}`);

  const updateDbPayload = {};
  const updateAuthPayload = {};

  /* following are updated in Firebase Realtime Database */
  if (type !== "EMPTY") updateDbPayload.type = type;

  /* following are updated in Firebase Auth */
  if (photoURL) updateAuthPayload.photoURL = photoURL;
  if (firstName && lastName) {
    updateAuthPayload.displayName = `${firstName} ${lastName}`;
  } else if ((!firstName && lastName) || (firstName && !lastName)) {
    return Promise.reject("First name and last name are both required");
  }

  if (
    Object.keys(updateDbPayload).length === 0 &&
    Object.keys(updateAuthPayload).length === 0
  )
    return Promise.resolve();

  const updates = [
    fbRtdbUpdate(RtDbPaths.IDENTITY, `${uid}/`, updateDbPayload),
    updateProfile(updateAuthPayload),
  ];

  return Promise.allSettled(updates).then((results) => {
    const errors = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);
    if (errors.length > 0) return Promise.reject(errors);
    return Promise.resolve();
  });
}

/**
 * @param {string} uid
 * @param {UserDetailsEnum[]} keys
 * @returns {Promise<void>}
 */
async function removeUserDetails(uid, keys) {
  if (!uid) {
    console.error(`${MODULE_NAME}::removeUserDetails: uid =`, uid);
    return Promise.resolve();
  }

  console.log(`${MODULE_NAME}::removeUserDetails: rm keys =`, keys);

  const updateDbPayload = {};
  const updateAuthPayload = {};

  keys.forEach((key) => {
    if (key === UserDetailsEnum.type) updateDbPayload.type = null;
    else updateAuthPayload[key] = null;
  });

  if (
    Object.keys(updateDbPayload).length === 0 &&
    Object.keys(updateAuthPayload).length === 0
  )
    return Promise.resolve();

  const updates = [
    fbRtdbUpdate(RtDbPaths.IDENTITY, `${uid}/`, updateDbPayload),
    updateProfile(updateAuthPayload),
  ];

  return Promise.allSettled(updates).then((results) => {
    const errors = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);
    if (errors.length > 0) return Promise.reject(errors);
    return Promise.resolve();
  });
}

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
          if (data.type && data.type !== "EMPTY") newUser.setType(data.type);
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
      updateUserDetails(finalUser.uid, { type })
        .then(() => tiggerAuthDataRefresh(finalUser.uid))
        .then(() => notify("Profile type updated successfully", "success")),
    [finalUser.uid, notify]
  );

  const updateProfilePhoto = useCallback(
    /**
     * @param {File} image
     * @returns {Promise<string>}
     */
    async (image) =>
      new Promise((resolve, reject) =>
        fbStorageUpload(StoragePaths.PROFILE_PHOTOS, finalUser.uid, image)
          .then(async (photoURL) => {
            await tiggerAuthDataRefresh(finalUser.uid);
            return photoURL;
          })
          .then((photoURL) => {
            updateProfile({ photoURL });
            resolve(photoURL);
          })
          .then(() => notify("Profile photo updated successfully", "success"))
          .catch((e) => reject(e))
      ),
    [finalUser.uid, notify]
  );

  const updateProfileName = useCallback(
    /**
     * @param {string} firstName
     * @param {string} lastName
     * @returns {Promise<void>}
     */
    async (firstName, lastName) =>
      updateProfile({ firstName, lastName })
        .then(() => tiggerAuthDataRefresh(finalUser.uid))
        .then(() => notify("Profile name updated successfully", "success")),
    [finalUser.uid, notify]
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
        .then((result) => {
          if (!result)
            return Promise.reject("Mobile number verification failed");
          return Promise.resolve();
        })
        .catch(async (error) => {
          if (error?.code !== "auth/provider-already-linked")
            return Promise.reject(error);
          await LinkMobileNumber.unlinkPhoneNumber();
          return await LinkMobileNumber.verifyOtp(otp);
        })
        // .then(() => updateUserDetailsInDb({ mobile: finalUser.mobile }))
        .then(() => tiggerAuthDataRefresh(finalUser.uid))
        .then(() => notify("Mobile number verified successfully", "success")),

    [finalUser.uid, notify]
  );

  const unlinkPhoneNumber = useCallback(
    /**
     * @returns {Promise<void>}
     */
    async () =>
      LinkMobileNumber.unlinkPhoneNumber()
        .then(() => tiggerAuthDataRefresh(finalUser.uid))
        .then(() => notify("Mobile number unlinked successfully", "success")),
    [finalUser.uid, notify]
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
    () => fbAuthLogOut().then(() => notify("Logged out", "info")),
    [notify]
  );

  return (
    <AuthContext.Provider
      value={{
        state: authState,
        user: finalUser,
        updateUserDetails,
        removeUserDetails,
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
