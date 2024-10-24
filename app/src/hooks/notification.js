import { useEffect, useCallback, useContext } from "react";
import NotificationContext from "../contexts/notification.js";

export default function useNotification() {
  const {
    notificationQueue,
    setNotificationQueue,
    currentNotification,
    setCurrentNotification,
  } = useContext(NotificationContext);

  const notify = useCallback(
    /**
     *
     * @param {string} message
     * @param {"info" | "success" | "warning" | "error"} kind
     */
    (message, kind) => {
      setNotificationQueue((prevQueue) => [...prevQueue, { message, kind }]);
    },
    []
  );

  useEffect(() => {
    if (!currentNotification.message && notificationQueue.length > 0) {
      const nextNotification = notificationQueue[0];
      setCurrentNotification(nextNotification);

      const timer = setTimeout(() => {
        setCurrentNotification({ message: "", kind: "info" });
        setNotificationQueue((prevQueue) => prevQueue.slice(1));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentNotification, notificationQueue]);

  return notify;
}
