import React, { useEffect, useState, useContext } from "react";
import NotificationContext from "../../contexts/notification.js";
import "./styles.css";

function Notification() {
  const [visible, setVisible] = useState(
    /** @type {"init" | "visible" | "gone"} */
    ("init")
  );

  const { currentNotification, setCurrentNotification } =
    useContext(NotificationContext);
  const { message, kind } = currentNotification;

  useEffect(() => {
    if (!message) return;
    setVisible("visible");
    const timeout = setTimeout(() => {
      setVisible("gone");
      setTimeout(
        () => setCurrentNotification({ message: "", kind: "error" }),
        300
      );
    }, 5000);
    return () => clearTimeout(timeout);
  }, [message]);

  return (
    <div
      className={[
        "components-Notification",
        `components-Notification-type-${kind}`,
        `components-Notification-anim-${visible}`,
      ]
        .join(" ")
        .trim()}
    >
      <i className="fa fa-exclamation-circle" />
      <span className="txt-msg">{message}</span>
      <i className="btn-close fa fa-close" onClick={() => setVisible("gone")} />
    </div>
  );
}

export default Notification;
