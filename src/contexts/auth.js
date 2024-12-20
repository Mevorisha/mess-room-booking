import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import UserContext, { UploadedImage, User } from "./user.js";
import useNotification from "../hooks/notification.js";
import { RtDbPaths } from "../modules/firebase/init.js";
import {
  logOut as fbAuthLogOut,
  onAuthStateChanged,
} from "../modules/firebase/auth.js";
import { onDbContentChange } from "../modules/firebase/db.js";
import { isEmpty } from "../modules/util/validations.js";

const MODULE_NAME = "contexts/auth.js";

/* -------------------------------------- ENUMS ----------------------------------- */

/**
 * @enum {"STILL_LOADING" | "NOT_LOGGED_IN" | "LOGGED_IN"}
 */
export const AuthStateEnum = {
  STILL_LOADING: /** @type {"STILL_LOADING"} */ ("STILL_LOADING"),
  NOT_LOGGED_IN: /** @type {"NOT_LOGGED_IN"} */ ("NOT_LOGGED_IN"),
  LOGGED_IN: /**     @type {"LOGGED_IN"}     */ ("LOGGED_IN"),
};

/* ---------------------------------- AUTH CONTEXT OBJECT ----------------------------------- */

/**
 * @typedef  {Object} AuthContextType
 * @property {AuthStateEnum} state
 * @property {() => Promise<void>} logOut
 */

const AuthContext = createContext(
  /** @type {AuthContextType} */ ({
    state: AuthStateEnum.STILL_LOADING,
    logOut: async () => {},
  })
);

export default AuthContext;

/* ------------------------------------ AUTH PROVIDER COMPONENT ----------------------------------- */

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(
    /** @type {AuthStateEnum} */ (AuthStateEnum.STILL_LOADING)
  );
  const { user, setUser } = useContext(UserContext);

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
        setUser(User.fromFirebaseAuthUser(user));
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
  }, [notify, setUser]);

  /* --------------------------------------- USE EFFECTS RTDB LISTENER ----------------------------------- */

  /* listen for changes at rtdb at RtDbPaths.IDENTITY/user.uid/ if temp user is updated
   * and update the final user with additional data from rtdb */
  useEffect(() => {
    if (!user.uid) return;
    if (authState === AuthStateEnum.NOT_LOGGED_IN) return;

    /*
     * This useEffect is called twice in prod and 4 times in dev:
     * - 1. When state is STILL_LOADING: at this stage, additional data is fetched from RtDb.
     *      This state changes state to LOGGED_IN.
     * - 2. When state is LOGGED_IN: at this stage, updates to local state are fetched form RtDb.
     */

    const unsubscribe = onDbContentChange(
      RtDbPaths.Identity(user.uid),
      (data) => {
        console.log(
          `${MODULE_NAME}::onDbContentChange: ${authState}: new data =`,
          data
        );

        if (!data) {
          setUser(User.loadCurrentUser());
          setAuthState(AuthStateEnum.LOGGED_IN);
          return;
        }

        setUser(() => {
          const newUser = User.loadCurrentUser();
          if (!isEmpty(data.type)) newUser.setType(data.type);
          if (!isEmpty(data.profilePhotos))
            newUser.setProfilePhotos(
              new UploadedImage(
                newUser.uid,
                data.profilePhotos.small,
                data.profilePhotos.medium,
                data.profilePhotos.large,
                "PUBLIC"
              )
            );
          if (!isEmpty(data.identityPhotos))
            newUser.setIdentityPhotos({
              workId: data.identityPhotos.workId,
              govId: data.identityPhotos.govId,
            });
          return newUser;
        });

        setAuthState(AuthStateEnum.LOGGED_IN);
      }
    );

    return () => unsubscribe();
  }, [authState, user.uid, setUser]);

  /* ------------------------------------ AUTH CONTEXT PROVIDER API FN ----------------------------------- */

  const logOut = useCallback(
    /**
     * @returns {Promise<void>}
     */
    () =>
      fbAuthLogOut()
        .then(() => notify("Logged out", "info"))
        .then(() => setUser(User.empty())),
    [notify, setUser]
  );

  return (
    <AuthContext.Provider
      value={{
        state: authState,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
