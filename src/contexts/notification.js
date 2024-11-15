import React, { createContext, useCallback, useState } from "react";

const NotificationContext = createContext({
  message: /** @type {string} */ (""),
  kind: /** @type {"info" | "success" | "warning" | "error"} */ ("error"),

  setMessage: /** @type {(val: string) => void} */ (() => {}),
  setKind:
    /** @type {(val: "info" | "success" | "warning" | "error") => void} */ (
      () => {}
    ),

  animstate: /** @type {"init" | "visible" | "gone"} */ ("init"),
  setAnimState: /** @type {(val: "init" | "visible" | "gone") => void} */ (
    () => {}
  ),

  showNotification: /** @type {() => void} */ (() => {}),
  hideNotification: /** @type {() => void} */ (() => {}),

  setNotifDisplayTimeout: /** @type {(val: NodeJS.Timeout) => void} */ (
    () => {}
  ),
  clearNotifDisplayTimeout: /** @type {() => void} */ (() => {}),
});

export default NotificationContext;

export function NotificationProvider({ children }) {
  const [message, setMessage] = useState("");

  const [kind, setKind] = useState(
    /** @type {"info" | "success" | "warning" | "error"} */ ("error")
  );

  const [animstate, setAnimState] = useState(
    /** @type {"init" | "visible" | "gone"} */ ("init")
  );

  /* this state is used to clear the display timeout */
  const [notifDisplayTimeout, setNotifDisplayTimeout_] = useState(
    setTimeout(() => {}, 0)
  );

  const showNotification = useCallback(
    () =>
      /* begin sliding in animation */
      setAnimState("visible"),
    [setAnimState]
  );

  const setNotifDisplayTimeout = useCallback(
    /** @param {NodeJS.Timeout} newVal */
    (newVal) =>
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
    </NotificationContext.Provider>
  );
}
