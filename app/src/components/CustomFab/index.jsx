import React from "react";
import "./styles.css";

/**
 * @typedef {Object} CustomFabProps
 * @property {number} marginBottom - The bottom margin for the button
 * @property {string} title - The text to display on the button
 * @property {React.MouseEventHandler<HTMLButtonElement>} onClick - The function to call when the button is clicked
 *
 * CustomFab - A custom floating action button component
 * @param {CustomFabProps} props
 */
export default function CustomFab({ marginBottom, title, onClick }) {
  const buttonStyle = {
    bottom: "" + marginBottom + "px" || "20p",
  };

  return (
    <button className="components-CustomFab" style={buttonStyle} onClick={onClick}>
      <span className="text">{title}</span>
    </button>
  );
}
