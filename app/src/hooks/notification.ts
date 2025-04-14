import { useCallback, useContext } from "react";
import NotificationContext from "@/contexts/notification.jsx";

export default function useNotification(): (
  message: string | Error,
  kind: "info" | "success" | "warning" | "error"
) => void {
  const { setMessage, setKind, showNotification, hideNotification, setNotifDisplayTimeout } =
    useContext(NotificationContext);

  const notify = useCallback(
    (message: string | Error, kind: "info" | "success" | "warning" | "error") => {
      /* if no message, following doesn't happen:
       * - notification doesn't slide in
       * - notification is not scheduled to begin sliding out after 5 seconds
       * - notification is not hidden 300ms after sliding out animation ends
       */
      if (typeof message === "string" && message.length <= 0) return;
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
