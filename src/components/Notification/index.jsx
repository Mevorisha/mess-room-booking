import React, { useEffect, useState, useContext } from "react";
import NotificationContext from "../../contexts/notification.js";
import "./styles.css";

function Notification() {
  /* this state controls which css animation to play
   * "init" -> start notification offscreen
   * "visible" -> slide notification into view
   * "gone" -> slide notification offscreen
   */
  const [animstate, setAnimState] = useState(
    /** @type {"init" | "visible" | "gone"} */
    ("init")
  );

  /* this state is used to clear the display timeout */
  const [notifDisplayTimeout, setNotifDisplayTimeout] = useState(
    setTimeout(() => {}, 0)
  );

  /* this state is used to clear the content clearing timeout */
  const [notifClearContentTimeout, setNotifClearContentTimeout] = useState(
    setTimeout(() => {}, 0)
  );

  /* get current notification and setter function from context */
  const { currentNotification, setCurrentNotification } =
    useContext(NotificationContext);

  /* destructure message and kind from currentNotification */
  const { message, kind } = currentNotification;

  function handleSlideIn() {
    /* clear hide animation timeout if it exists:
     * this is necessary because user may issue a new notification
     * before the hide animation is completed, which would cause
     * the notification to slide in but the content will be cleared */
    clearTimeout(notifClearContentTimeout);
    /* begin sliding in animation */
    setAnimState("visible");
  }

  function handleSlideOut() {
    /* clear timeout if it exists:
     * this is necessary because the notification may be manually
     * closed before the timeout is reached */
    clearTimeout(notifDisplayTimeout);
    /* begins sliding out animation */
    setAnimState("gone");
    /* schedules notification message to be cleared after sliding out animation ends */
    const timeout = setTimeout(
      () => setCurrentNotification({ message: "", kind: "error" }),
      300
    );
    /* set timeout state so it can be cleared if new notification is issued
     * before the timeout is reached */
    setNotifClearContentTimeout(timeout);
  }

  useEffect(() => {
    /* if no message, following doesn't happen:
     * - notification doesn't slide in
     * - notification is not scheduled to begin sliding out after 5 seconds
     * - notification is not hidden 300ms after sliding out animation ends
     */
    if (!message) return;
    /* begin sliding in animation */
    handleSlideIn();
    /* schedules notification to slide out after 5 seconds */
    const timeout = setTimeout(handleSlideOut, 5000);
    /* set timeout state so it can be cleared if notification is manually closed */
    setNotifDisplayTimeout(timeout);
    /* this is needed to clear the timeout if the component unmounts
     * before the timeout is reached. not needed if there is guarantee
     * that the timeout will be cleared before the component unmounts */
    return () => clearTimeout(timeout);
  }, [message]);

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
      <i className="btn-close fa fa-close" onClick={handleSlideOut} />
    </div>
  );
}

export default Notification;
