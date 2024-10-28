import React, { createContext, useState, useEffect, useCallback } from "react";
import { RtDbPaths } from "../modules/firebase/init.js";
import { onAuthStateChanged } from "../modules/firebase/auth.js";
import { fbRtdbUpdate, onDbContentChange } from "../modules/firebase/db.js";
import useNotification from "../hooks/notification.js";

/**
 * @enum {string}
 */
export const AuthState = {
  STILL_LOADING: "STILL_LOADING",
  NOT_LOGGED_IN: "NOT_LOGGED_IN",
  LOGGED_IN: "LOGGED_IN",
};

export class User {
  /**
   * @param {string} uid
   * @param {"TENANT" | "OWNER" | "EMPTY"} type
   * @param {string} photoURL
   */
  constructor(uid, type = "EMPTY", photoURL = "") {
    this.uid = uid;
    this.type = type;
    this.photoURL = photoURL;
  }

  /**
   * @returns {User}
   */
  static empty() {
    return new User("");
  }
}

const AuthContext = createContext({
  /** @type {AuthState} */
  state: AuthState.STILL_LOADING,
  /** @type {User} */
  user: User.empty(),
  /** @type {(type: "TENANT" | "OWNER" | "EMPTY", photoURL: string) => void} */
  updateUserDetailsInDb: () => {},
});

export default AuthContext;

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(AuthState.STILL_LOADING);
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
      if (null == uid) setAuthState(AuthState.NOT_LOGGED_IN);
      else {
        setAuthState(AuthState.STILL_LOADING);
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
    if (authState === AuthState.NOT_LOGGED_IN) return;

    // console.error("onDbContentChange started");

    const unsubscribe = onDbContentChange(
      RtDbPaths.IDENTITY,
      `${userUid}/`,
      (data) => {
        // console.error("onDbContentChange updated, data = ", data);
        if (!data) setFinalUser(new User(userUid));
        else setFinalUser(new User(userUid, data.type, data.photoURL ?? ""));
        setAuthState(AuthState.LOGGED_IN);
      }
    );

    return () => {
      // console.error("onDbContentChange stopped");
      unsubscribe();
    };
  }, [authState, userUid, setFinalUser]);

  /**
   * @param {"TENANT" | "OWNER" | "EMPTY"} type
   * @param {string} photoURL
   */
  const updateUserDetailsInDb = useCallback(
    (type = "EMPTY", photoURL = "") => {
      const updatePayload = {};

      if (type !== "EMPTY") updatePayload.type = type;
      if (photoURL) updatePayload.photoURL = photoURL;

      if (Object.keys(updatePayload).length === 0) return;

      fbRtdbUpdate(RtDbPaths.IDENTITY, `${userUid}/`, updatePayload).catch(
        (e) => notify(e.toString(), "error")
      );
    },
    [userUid, notify]
  );

  return (
    <AuthContext.Provider
      value={{ state: authState, user: finalUser, updateUserDetailsInDb }}
    >
      {children}
    </AuthContext.Provider>
  );
}
