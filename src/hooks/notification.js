import { useCallback, useContext } from "react";
import NotificationContext from "../contexts/notification.js";

export default function useNotification() {
  const { setCurrentNotification } = useContext(NotificationContext);

  const notify = useCallback(
    /**
     *
     * @param {string} message
     * @param {"info" | "success" | "warning" | "error"} kind
     */
    (message, kind) => {
      setCurrentNotification({ message, kind });
    },
    [setCurrentNotification]
  );

  return notify;
}
