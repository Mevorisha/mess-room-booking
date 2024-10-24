import React, { useEffect, useState } from "react";
import "./styles.css";

/**
 * @param {{
 *   message: string,
 *   kind: "info" | "success" | "warning" | "error"
 * }} props
 */
function Notification({ message, kind }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <div
      className={`notification notif-${kind} ${
        visible ? "slide-down" : "slide-up"
      }`}
    >
      {message}
    </div>
  );
}

export default Notification;
