import { useEffect, useContext } from "react";
import { onAuthStateChanged } from "../modules/firebase/auth.js";
import useNotification from "./notification.js";
import AuthContext from "../contexts/auth.js";

/**
 * @returns {{ uid: string } | null}
 */
export default function useAuth() {
  const { user, setUser } = useContext(AuthContext);
  const notify = useNotification();

  useEffect(() => {
    let unsubscribeOutside = () => {};

    onAuthStateChanged((useruid, unsubscribeInside) => {
      unsubscribeOutside = unsubscribeInside;

      if (useruid) setUser({ uid: useruid });
      else setUser({ uid: "" });

      if (!useruid) notify("You are not logged in", "warning");
    });

    return () => unsubscribeOutside();
  }, [setUser]);

  return user.uid ? user : null;
}
