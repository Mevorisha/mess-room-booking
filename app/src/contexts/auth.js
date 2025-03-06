import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import UserContext, { UploadedImage, User } from "./user.js";
import LanguageContext from "./language.js";
import useNotification from "../hooks/notification.js";
import { AuthLock, logOut as fbAuthLogOut, onAuthStateChanged } from "../modules/firebase/auth.js";
import { isEmpty } from "../modules/util/validations.js";
import { lang } from "../modules/util/language.js";
import { apiGetOrDelete, ApiPaths } from "../modules/util/api.js";

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

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(/** @type {AuthStateEnum} */ (AuthStateEnum.STILL_LOADING));
  const { user, dispatchUser } = useContext(UserContext);

  const notify = useNotification();

  const { setLang } = useContext(LanguageContext);

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
        dispatchUser({ fromFirebaseAuth: user });
        /* mark as still loading as type and identity details are yet to be fetched from rtdb */
        AuthLock.CREATING_USER.onClear(() => setAuthState(AuthStateEnum.STILL_LOADING));
      }

      console.log(`${MODULE_NAME}::onAuthStateChanged: new user =`, user ? User.fromFirebaseAuthUser(user) : null);

      if (null == user) notify(lang("You are not logged in", "আপনি লগইন করেননি", "आप लॉगिन नहीं किए हैं"), "warning");
    });

    return () => unsubscribe();
  }, [notify, dispatchUser]);

  /* --------------------------------------- USE EFFECTS GET DATA USING API ----------------------------------- */

  useEffect(() => {
    if (!user.uid) return;
    if (authState === AuthStateEnum.NOT_LOGGED_IN) return;

    /**
     * @param {Object} onlineProfileData
     */
    function updateLocalUser(onlineProfileData) {
      console.log(`${MODULE_NAME}::updateLocalUser: ${authState}: new data =`, onlineProfileData);

      if (!onlineProfileData) {
        dispatchUser("LOADCURRENT");
        setAuthState(AuthStateEnum.LOGGED_IN);
        return;
      }

      if (!isEmpty(onlineProfileData.type)) {
        dispatchUser({ type: onlineProfileData.type });
      }

      if (!isEmpty(onlineProfileData.email)) {
        dispatchUser({ mobile: onlineProfileData.email });
      }

      if (!isEmpty(onlineProfileData.mobile)) {
        dispatchUser({ mobile: onlineProfileData.mobile });
      }

      if (!isEmpty(onlineProfileData.firstName)) {
        dispatchUser({ firstName: onlineProfileData.firstName });
      }

      if (!isEmpty(onlineProfileData.lastName)) {
        dispatchUser({ lastName: onlineProfileData.lastName });
      }

      if (!isEmpty(onlineProfileData.profilePhotos)) {
        dispatchUser({ profilePhotos: UploadedImage.from(user.uid, onlineProfileData.profilePhotos, false) });
      }

      if (!isEmpty(onlineProfileData.identityPhotos)) {
        let workId, govId;
        if (!isEmpty(onlineProfileData.identityPhotos.workId)) {
          workId = UploadedImage.from(
            user.uid,
            onlineProfileData.identityPhotos.workId,
            onlineProfileData.identityPhotos.workIdIsPrivate
          );
        }
        if (!isEmpty(onlineProfileData.identityPhotos.govId)) {
          govId = UploadedImage.from(
            user.uid,
            onlineProfileData.identityPhotos.govId,
            onlineProfileData.identityPhotos.govIdIsPrivate
          );
        }
        dispatchUser({ identityPhotos: { workId, govId } });
      }

      if (onlineProfileData.language) {
        setLang(onlineProfileData.language, false);
      }
    }

    /*
     * This useEffect is called twice in prod and 4 times in dev:
     * - 1. When state is STILL_LOADING: at this stage, additional data is fetched from API.
     *      This state changes state to LOGGED_IN.
     * - 2. When state is LOGGED_IN: at this stage, updates to local state are fetched form API.
     */

    apiGetOrDelete("GET", ApiPaths.Profile.read(user.uid))
      .then(({ json }) => updateLocalUser(json))
      .then(() => setAuthState(AuthStateEnum.LOGGED_IN))
      .catch((e) => notify(e, "error"));
  }, [authState, user.uid, dispatchUser, notify, setLang]);

  /* ------------------------------------ AUTH CONTEXT PROVIDER API FN ----------------------------------- */

  const logOut = useCallback(
    /**
     * @returns {Promise<void>}
     */
    () =>
      fbAuthLogOut()
        .then(() => notify(lang("Logged out", "লগ আউট করা হয়েছে", "लॉगआउट किया गया है"), "info"))
        .then(() => dispatchUser("RESET")),
    [notify, dispatchUser]
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
