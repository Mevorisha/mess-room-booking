import { useEffect, useContext } from "react";
import { onAuthStateChanged } from "../modules/firebase/auth.js";
import useNotification from "./notification.js";
import AuthContext, { User } from "../contexts/auth.js";

/**
 * @returns {User | null} If null, state is loading. If empty string, user is not logged in. If not empty, user is logged in.
 */
export default function useAuth() {
  const { user, setUser } = useContext(AuthContext);
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

  useEffect(() => {
    // console.error("onAuthStateChanged started, uid = ", user.uid);
    const unsubscribe = onAuthStateChanged((useruid) => {
      if (useruid) setUser(new User(useruid));
      else setUser(new User(""));
      // console.error("onAuthStateChanged updated, uid = ", useruid);
      if (!useruid) notify("You are not logged in", "warning");
    });
    return () => {
      // console.error("onAuthStateChanged stopped, uid = ", user.uid);
      unsubscribe();
    };
  }, [setUser, notify]);

  return user;
}
