import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import UserContext from "./user.jsx";
import LanguageContext from "./language.jsx";
import useNotification from "@/hooks/notification.js";
import { AuthLock, logOut as fbAuthLogOut, onAuthStateChanged } from "@/modules/firebase/auth.js";
import { lang } from "@/modules/util/language.js";
import { apiGetOrDelete, ApiPaths } from "@/modules/util/api.js";
import IdentityWrapper from "@/modules/classes/User.js";
import { HttpMethodTypes, IdentityGetResBodyWithAuthDTO } from "sharedtypes";

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
  const { user, setUser } = useContext(UserContext);

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
      if (user == null) setAuthState(AuthStateEnum.NOT_LOGGED_IN);
      else {
        setUser(IdentityWrapper.fromFirebaseAuthUser(user));
        /* mark as still loading as type and identity details are yet to be fetched from rtdb */
        AuthLock.CREATING_USER.onClear(() => setAuthState(AuthStateEnum.STILL_LOADING));
      }

      console.log(
        `${MODULE_NAME}::onAuthStateChanged: new user =`,
        user != null ? IdentityWrapper.fromFirebaseAuthUser(user) : null
      );

      if (user == null) notify(lang("You are not logged in", "আপনি লগইন করেননি", "आप लॉगिन नहीं किए हैं"), "warning");
    });

    return () => unsubscribe();
  }, [notify, setUser]);

  /* --------------------------------------- USE EFFECTS GET DATA USING API ----------------------------------- */

  useEffect(() => {
    if (user.uid === "") return;
    if (authState === AuthStateEnum.NOT_LOGGED_IN) return;

    async function updateLocalUser(onlineProfileData?: IdentityGetResBodyWithAuthDTO): Promise<void> {
      console.log(`${MODULE_NAME}::updateLocalUser: ${authState}: new data =`, onlineProfileData);

      // NOTE: This functions is called if authState is either LOGGED_IN or STILL_LOADING and that implies
      // user has email AND uid

      const currentUser = IdentityWrapper.loadCurrentUser();
      if (currentUser == null) {
        return Promise.reject(new Error("Failed to load user from Firebase"));
      }
      if (onlineProfileData != null) {
        currentUser.set("identity", onlineProfileData);
      }
      setUser(currentUser);
    }

    /*
     * This useEffect is called twice in prod and 4 times in dev:
     * - 1. When state is STILL_LOADING: at this stage, additional data is fetched from API.
     *      This state changes state to LOGGED_IN.
     * - 2. When state is LOGGED_IN: at this stage, updates to local state are fetched form API.
     */

    apiGetOrDelete(HttpMethodTypes.GET, ApiPaths.Profile.read(user.uid), IdentityGetResBodyWithAuthDTO)
      .then(({ dto }) => updateLocalUser(dto))
      .then(() => setAuthState(AuthStateEnum.LOGGED_IN))
      .catch((e: Error) => notify(e, "error"));
  }, [authState, setUser, notify, setLang, user.uid]);

  /* ------------------------------------ AUTH CONTEXT PROVIDER API FN ----------------------------------- */

  const logOut = useCallback(
    (): Promise<void> =>
      fbAuthLogOut()
        .then(() => notify(lang("Logged out", "লগ আউট করা হয়েছে", "लॉगआउट किया गया है"), "info"))
        .then(() => setUser(null)),
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
