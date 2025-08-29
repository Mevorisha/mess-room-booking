import { useCallback, useContext } from "react";
import NotificationContext from "@/contexts/notification.jsx";
import { DtoValidationError, MultipleErrors } from "sharedtypes";

export default function useNotification(): (
  message: string | Error,
  kind: "info" | "success" | "warning" | "error"
) => void {
  const { setMessage, setKind, showNotification, hideNotification, setNotifDisplayTimeout } =
    useContext(NotificationContext);

  const notify = useCallback(
    (
      msgOrErr: string | DtoValidationError | MultipleErrors | Error,
      kind: "info" | "success" | "warning" | "error"
    ) => {
      /* if no message, following doesn't happen:
       * - notification doesn't slide in
       * - notification is not scheduled to begin sliding out after 5 seconds
       * - notification is not hidden 300ms after sliding out animation ends
       */
      if (typeof msgOrErr === "string" && msgOrErr.length <= 0) return;
      /* set message and kind */
      if (msgOrErr instanceof DtoValidationError) {
        const allErrMsg = msgOrErr.message.split("\n").map((str) => str.trim());
        const lineOne = allErrMsg[1];
        const cleanMsg =
          lineOne != null
            ? `DtoValidationError: ${lineOne} (and ${allErrMsg.length - 3} more)`
            : `DtoValidationError (total ${allErrMsg.length})`;
        setMessage(cleanMsg);
      } else if (msgOrErr instanceof MultipleErrors) {
        setMessage(msgOrErr.getSummary());
      } else if (msgOrErr instanceof Error) {
        setMessage(msgOrErr.message.toString());
      } else {
        setMessage(msgOrErr);
      }
      setKind(kind);
      if (kind === "error") console.error(msgOrErr);
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
