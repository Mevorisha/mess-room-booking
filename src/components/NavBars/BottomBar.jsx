import React from "react";

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export default function BottomBar({ children }) {
  return (
    <div className="components-BottomBar">
      <div className="section-buttons-container">{children}</div>
    </div>
  );
}
