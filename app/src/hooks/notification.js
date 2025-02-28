import { useCallback, useContext } from "react";
import NotificationContext from "../contexts/notification.js";

/**
 * @returns {(message: string | Error, kind: "info" | "success" | "warning" | "error") => void}
 */
export default function useNotification() {
  const { setMessage, setKind, showNotification, hideNotification, setNotifDisplayTimeout } =
    useContext(NotificationContext);

  const notify = useCallback(
    /**
     *
     * @param {string | Error} message
     * @param {"info" | "success" | "warning" | "error"} kind
     */
    (message, kind) => {
      /* if no message, following doesn't happen:
       * - notification doesn't slide in
       * - notification is not scheduled to begin sliding out after 5 seconds
       * - notification is not hidden 300ms after sliding out animation ends
       */
      if (!message) return;
      /* set message and kind */
      setMessage(message instanceof Error ? message.toString() : message);
      setKind(kind);
      if (kind === "error") console.error(message);
      /* begin sliding in animation */
      showNotification();
      /* schedules notification to slide out after 5 seconds */
      const timeout = setTimeout(hideNotification, 5000);
      /* set timeout state so it can be cleared if notification is manually closed */
      setNotifDisplayTimeout(timeout);
    },
    [setMessage, setKind, showNotification, hideNotification, setNotifDisplayTimeout]
  );

  return notify;
}
