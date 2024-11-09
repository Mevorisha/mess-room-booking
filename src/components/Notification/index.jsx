import React, { useContext } from "react";
import NotificationContext from "../../contexts/notification.js";
import "./styles.css";

function Notification() {
  const {
    message,
    kind,
    animstate,
    hideNotification,
    clearNotifDisplayTimeout,
  } = useContext(NotificationContext);

  function dismissNotification() {
    hideNotification();
    clearNotifDisplayTimeout();
  }

  return (
    <div
      className={[
        "components-Notification",
        `components-Notification-type-${kind}`,
        `components-Notification-anim-${animstate}`,
      ]
        .join(" ")
        .trim()}
    >
      <i className="fa fa-exclamation-circle" />
      <span className="txt-msg">{message}</span>
      <i className="btn-close fa fa-close" onClick={dismissNotification} />
    </div>
  );
}

export default Notification;
