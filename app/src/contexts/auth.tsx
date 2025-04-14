import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import UserContext from "./user.jsx";
import LanguageContext from "./language.jsx";
import useNotification from "@/hooks/notification.js";
import { AuthLock, logOut as fbAuthLogOut, onAuthStateChanged } from "@/modules/firebase/auth.js";
import { lang } from "@/modules/util/language.js";
import { apiGetOrDelete, ApiPaths } from "@/modules/util/api.js";
import IdentityNetworkType from "@/modules/networkTypes/Identity.js";
import User from "@/modules/classes/User.js";
import UploadedImage from "@/modules/classes/UploadedImage.js";

const MODULE_NAME = "contexts/auth.jsx";

/* -------------------------------------- ENUMS ----------------------------------- */

export enum AuthStateEnum {
  STILL_LOADING = "STILL_LOADING",
  NOT_LOGGED_IN = "NOT_LOGGED_IN",
  LOGGED_IN = "LOGGED_IN",
}

/* ---------------------------------- AUTH CONTEXT OBJECT ----------------------------------- */

export interface AuthContextType {
  state: AuthStateEnum;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  state: AuthStateEnum.STILL_LOADING,
  logOut: async () => Promise.reject(new Error()),
});

export default AuthContext;

/* ------------------------------------ AUTH PROVIDER COMPONENT ----------------------------------- */

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const [authState, setAuthState] = useState<AuthStateEnum>(AuthStateEnum.STILL_LOADING);
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

      console.log(
        `${MODULE_NAME}::onAuthStateChanged: new user =`,
        user != null ? User.fromFirebaseAuthUser(user) : null
      );

      if (null == user) notify(lang("You are not logged in", "আপনি লগইন করেননি", "आप लॉगिन नहीं किए हैं"), "warning");
    });

    return () => unsubscribe();
  }, [notify, dispatchUser]);

  /* --------------------------------------- USE EFFECTS GET DATA USING API ----------------------------------- */

  useEffect(() => {
    if (user.uid.length === 0) return;
    if (authState === AuthStateEnum.NOT_LOGGED_IN) return;

    function updateLocalUser(onlineProfileData?: IdentityNetworkType) {
      console.log(`${MODULE_NAME}::updateLocalUser: ${authState}: new data =`, onlineProfileData);

      if (onlineProfileData == null) {
        dispatchUser("LOADCURRENT");
        setAuthState(AuthStateEnum.LOGGED_IN);
        return;
      }

      if (onlineProfileData.type != null) {
        dispatchUser({ type: onlineProfileData.type });
      }

      if (onlineProfileData.email != null) {
        dispatchUser({ mobile: onlineProfileData.email });
      }

      if (onlineProfileData.mobile != null) {
        dispatchUser({ mobile: onlineProfileData.mobile });
      }

      if (onlineProfileData.firstName != null) {
        dispatchUser({ firstName: onlineProfileData.firstName });
      }

      if (onlineProfileData.lastName != null) {
        dispatchUser({ lastName: onlineProfileData.lastName });
      }

      if (onlineProfileData.profilePhotos != null) {
        dispatchUser({ profilePhotos: UploadedImage.from(user.uid, onlineProfileData.profilePhotos, false) });
      }

      if (onlineProfileData.identityPhotos != null) {
        let workId: UploadedImage | null = null,
          govId: UploadedImage | null = null;
        if (onlineProfileData.identityPhotos.workId != null) {
          workId = UploadedImage.from(
            user.uid,
            onlineProfileData.identityPhotos.workId,
            onlineProfileData.identityPhotos.workIdIsPrivate ?? false
          );
        }
        if (onlineProfileData.identityPhotos.govId != null) {
          govId = UploadedImage.from(
            user.uid,
            onlineProfileData.identityPhotos.govId,
            onlineProfileData.identityPhotos.govIdIsPrivate ?? false
          );
        }
        if (workId != null && govId != null) dispatchUser({ identityPhotos: { workId, govId } });
        else if (workId != null && govId == null) dispatchUser({ identityPhotos: { workId } });
        else if (workId == null && govId != null) dispatchUser({ identityPhotos: { govId } });
      }

      if (onlineProfileData.language != null) {
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
      .catch((e: Error) => notify(e, "error"));
  }, [authState, user.uid, dispatchUser, notify, setLang]);

  /* ------------------------------------ AUTH CONTEXT PROVIDER API FN ----------------------------------- */

  const logOut = useCallback(
    (): Promise<void> =>
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
