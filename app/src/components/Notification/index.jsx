import React, { useEffect, useState } from "react";
import "./styles.css";

/**
 * @param {{
 *   message: string,
 *   kind: "info" | "success" | "warning" | "error"
 * }} props
 */
function Notification({ message, kind }) {
  const [visible, setVisible] = useState(
    /** @type {"init" | "visible" | "gone"} */
    ("init")
  );

  useEffect(() => {
    if (!message) return;
    setVisible("visible");
    const timeout = setTimeout(() => setVisible("gone"), 5000);
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
