import React, { createContext, useCallback, useState } from "react";
import Notification from "@/components/Notification";

export interface NotificationContextType {
  message: string;
  kind: "info" | "success" | "warning" | "error";
  setMessage: (val: string) => void;
  setKind: (val: "info" | "success" | "warning" | "error") => void;
  animstate: "init" | "visible" | "gone";
  setAnimState: (val: "init" | "visible" | "gone") => void;
  showNotification: () => void;
  hideNotification: () => void;
  setNotifDisplayTimeout: (val: NodeJS.Timeout) => void;
  clearNotifDisplayTimeout: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  message: "",
  kind: "error",
  setMessage: () => void 0,
  setKind: () => void 0,
  animstate: "init",
  setAnimState: () => void 0,
  showNotification: () => void 0,
  hideNotification: () => void 0,
  setNotifDisplayTimeout: () => void 0,
  clearNotifDisplayTimeout: () => void 0,
});

export default NotificationContext;

export function NotificationProvider({ children }: { children: React.JSX.Element }): React.JSX.Element {
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"info" | "success" | "warning" | "error">("error");
  const [animstate, setAnimState] = useState<"init" | "visible" | "gone">("init");

  /* this state is used to clear the display timeout */
  const [notifDisplayTimeout, setNotifDisplayTimeout_] = useState(setTimeout(() => void 0, 0));

  const showNotification = useCallback(
    () =>
      /* begin sliding in animation */
      setAnimState("visible"),
    [setAnimState]
  );

  const setNotifDisplayTimeout = useCallback(
    (newVal: NodeJS.Timeout) =>
      setNotifDisplayTimeout_((oldVal) => {
        clearTimeout(oldVal);
        return newVal;
      }),
    [setNotifDisplayTimeout_]
  );

  const clearNotifDisplayTimeout = useCallback(
    () =>
      /* clear timeout if it exists:
       * this is necessary because the notification may be manually
       * closed before the timeout is reached */
      clearTimeout(notifDisplayTimeout),
    [notifDisplayTimeout]
  );

  const hideNotification = useCallback(
    () =>
      /* begins sliding out animation */
      setAnimState("gone"),
    [setAnimState]
  );

  return (
    <NotificationContext.Provider
      value={{
        message,
        kind,
        setMessage,
        setKind,
        animstate,
        setAnimState,
        showNotification,
        hideNotification,
        setNotifDisplayTimeout,
        clearNotifDisplayTimeout,
      }}
    >
      {children}
      <Notification />
    </NotificationContext.Provider>
  );
}
