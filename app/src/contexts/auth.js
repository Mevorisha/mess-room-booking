import React, { createContext, useState, useEffect, useCallback } from "react";
import { RtDbPaths, StoragePaths } from "../modules/firebase/init.js";
import { onAuthStateChanged } from "../modules/firebase/auth.js";
import { fbRtdbUpdate, onDbContentChange } from "../modules/firebase/db.js";
import { fbStorageUpload } from "../modules/firebase/storage.js";
import useNotification from "../hooks/notification.js";

/**
 * @enum {"STILL_LOADING" | "NOT_LOGGED_IN" | "LOGGED_IN"}
 */
export const AuthStateEnum = {
  STILL_LOADING: /** @type {"STILL_LOADING"} */ ("STILL_LOADING"),
  NOT_LOGGED_IN: /** @type {"NOT_LOGGED_IN"} */ ("NOT_LOGGED_IN"),
  LOGGED_IN: /** @type {"LOGGED_IN"} */ ("LOGGED_IN"),
};

export class User {
  /**
   * @param {string} uid
   * @param {"TENANT" | "OWNER" | "EMPTY"} type
   * @param {string} photoURL
   * @param {string} mobile
   * @param {string} firstName
   * @param {string} lastName
   */
  constructor(
    uid,
    type = "EMPTY",
    photoURL = "",
    mobile = "",
    firstName = "",
    lastName = ""
  ) {
    this.uid = uid;
    this.type = type;
    this.photoURL = photoURL;
    this.mobile = mobile;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  /**
   * @returns {User}
   */
  static empty() {
    return new User("");
  }
}

/**
 * @enum {"type" | "photoURL" | "mobile" | "firstName" | "lastName"}
 */
export const UserDetailsEnum = {
  type: /** @type {"type"} */ ("type"),
  photoURL: /** @type {"photoURL"} */ ("photoURL"),
  mobile: /** @type {"mobile"} */ ("mobile"),
  firstName: /** @type {"firstName"} */ ("firstName"),
  lastName: /** @type {"lastName"} */ ("lastName"),
};

/**
 * @typedef {{
 *   type?: "TENANT" | "OWNER" | "EMPTY",
 *   photoURL?: string,
 *   mobile?: string,
 *   firstName?: string,
 *   lastName?: string
 * }} UserDetailsUpdatePayload
 *
 * @typedef {(payload: UserDetailsUpdatePayload) => void} FnUserDetailsUpdate
 */

const AuthContext = createContext({
  /** @type {AuthStateEnum} */
  state: AuthStateEnum.STILL_LOADING,
  /** @type {User} */
  user: User.empty(),
  /** @type {FnUserDetailsUpdate} */
  updateUserDetailsInDb: () => {},
  /** @type {(keys: UserDetailsEnum[]) => void} */
  removeUserDetailsInDb: () => {},
  /** @type {(type: "TENANT" | "OWNER" | "EMPTY") => void} */
  updateProfileType: () => {},
  /** @type {(image: File) => void} */
  updateProfilePhoto: () => {},
  /** @type {(firstName: string, lastName: string) => void} */
  updateProfileName: () => {},
});

export default AuthContext;

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(
    /** @type {AuthStateEnum} */ (AuthStateEnum.STILL_LOADING)
  );
  const [userUid, setUserUid] = useState("");
  const [finalUser, setFinalUser] = useState(User.empty());

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

  /* listen for auth state changes and update the temporary user */
  useEffect(() => {
    // console.error("onAuthStateChanged started");

    const unsubscribe = onAuthStateChanged((uid) => {
      if (null == uid) setAuthState(AuthStateEnum.NOT_LOGGED_IN);
      else {
        setAuthState(AuthStateEnum.STILL_LOADING);
        setUserUid(uid);
        setFinalUser(new User(uid));
      }

      // console.error(`onAuthStateChanged updated, new = ${uid}`);
      if (null == uid) notify("You are not logged in", "warning");
    });

    return () => {
      // console.error("onAuthStateChanged stopped");
      unsubscribe();
    };
  }, [setUserUid, notify]);

  /* listen for changes at rtdb at RtDbPaths.IDENTITY/user.uid/ if temp user is updated
   * and update the final user with additional data from rtdb */
  useEffect(() => {
    if (!userUid) return;
    if (authState === AuthStateEnum.NOT_LOGGED_IN) return;

    // console.error("onDbContentChange started");

    const unsubscribe = onDbContentChange(
      RtDbPaths.IDENTITY,
      `${userUid}/`,
      (data) => {
        // console.error("onDbContentChange updated, data = ", data);
        if (!data) setFinalUser(new User(userUid));
        else
          setFinalUser(
            new User(
              userUid,
              data.type ?? "EMPTY",
              data.photoURL ?? "",
              data.mobile ?? ""
            )
          );
        setAuthState(AuthStateEnum.LOGGED_IN);
      }
    );

    return () => {
      // console.error("onDbContentChange stopped");
      unsubscribe();
    };
  }, [authState, userUid, setFinalUser]);

  const updateUserDetailsInDb = useCallback(
    /**
     * @param {UserDetailsUpdatePayload} payload
     */
    ({
      type = "EMPTY",
      photoURL = "",
      mobile = "",
      firstName = "",
      lastName = "",
    }) => {
      const updatePayload = {};

      if (type !== "EMPTY") updatePayload.type = type;
      if (photoURL) updatePayload.photoURL = photoURL;
      if (mobile) updatePayload.mobile = mobile;
      if (firstName) updatePayload.firstName = firstName;
      if (lastName) updatePayload.lastName = lastName;

      if (Object.keys(updatePayload).length === 0) return;

      fbRtdbUpdate(RtDbPaths.IDENTITY, `${userUid}/`, updatePayload).catch(
        (e) => notify(e.toString(), "error")
      );
    },
    [userUid, notify]
  );

  const removeUserDetailsInDb = useCallback(
    /**
     * @param {UserDetailsEnum[]} keys
     */
    (keys) => {
      const updatePayload = {};
      keys.forEach((key) => {
        updatePayload[key] = null;
      });

      if (Object.keys(updatePayload).length === 0) return;

      fbRtdbUpdate(RtDbPaths.IDENTITY, `${userUid}/`, updatePayload).catch(
        (e) => notify(e.toString(), "error")
      );
    },
    [userUid, notify]
  );

  const updateProfileType = useCallback(
    /**
     * @param {"TENANT" | "OWNER" | "EMPTY"} type
     */
    (type) => {
      updateUserDetailsInDb({ type });
    },
    [updateUserDetailsInDb]
  );

  const updateProfilePhoto = useCallback(
    /**
     * @param {File} image
     */
    (image) => {
      // upload image to firebase storage
      // get the url of the uploaded image
      // update the user's photoURL
      fbStorageUpload(StoragePaths.PROFILE_PHOTOS, userUid, image)
        .then((photoURL) => {
          updateUserDetailsInDb({ photoURL });
        })
        .catch((e) => notify(e.toString(), "error"));
    },
    [userUid, notify, updateUserDetailsInDb]
  );

  const updateProfileName = useCallback(
    /**
     * @param {string} firstName
     * @param {string} lastName
     */
    (firstName, lastName) => {
      updateUserDetailsInDb({ firstName, lastName });
    },
    [updateUserDetailsInDb]
  );

  return (
    <AuthContext.Provider
      value={{
        state: authState,
        user: finalUser,
        updateUserDetailsInDb,
        removeUserDetailsInDb,
        updateProfileType,
        updateProfilePhoto,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
