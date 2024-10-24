import React, { createContext, useState } from "react";

const NotificationContext = createContext({
  currentNotification:
    /** @type {{ message: string, kind: "info" | "success" | "warning" | "error" }} */
    ({
      message: "",
      kind: "info",
    }),
  setCurrentNotification:
    /** @type {React.Dispatch<React.SetStateAction<{ message: string, kind: "info" | "success" | "warning" | "error" }>>} */ (
      () => {}
    ),
  notificationQueue:
    /** @type {{ message: string, kind: "info" | "success" | "warning" | "error" }[]} */ ([]),
  setNotificationQueue:
    /** @type {React.Dispatch<React.SetStateAction<{ message: string, kind: "info" | "success" | "warning" | "error" }[]>>} */ (
      () => {}
    ),
});

export default NotificationContext;

export function NotificationProvider({ children }) {
  const [currentNotification, setCurrentNotification] = useState(
    /** @type {{ message: string, kind: "info" | "success" | "warning" | "error" }} */
    ({
      message: "",
      kind: "info",
    })
  );

  const [notificationQueue, setNotificationQueue] = useState(
    /** @type {{ message: string, kind: "info" | "success" | "warning" | "error" }[]} */
    ([])
  );

  return (
    <NotificationContext.Provider
      value={{
        currentNotification,
        setCurrentNotification,
        notificationQueue,
        setNotificationQueue,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
