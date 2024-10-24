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
      setTimeout(() => setCurrentNotification({ message: "", kind: "info" }), 300);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [message]);

  return (
    <div className={`notification notif-${kind} ${`notif-anim-${visible}`}`}>
      {message}
      <i className="close fa fa-close" onClick={() => setVisible("gone")} />
      {/* <span className="close" onClick={() => setVisible("gone")}>
        x
      </span> */}
    </div>
  );
}

export default Notification;
