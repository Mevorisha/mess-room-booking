import React from "react";
import "./styles.css";

/**
 * A custom floating action button component.
 *
 * Renders a styled button that displays a text label and handles click events.
 * The button’s bottom style is set based on the provided `marginBottom` (in pixels),
 * with a fallback style applied when `marginBottom` is not supplied.
 *
 * @typedef {Object} CustomFabProps
 * @property {number} marginBottom - The bottom margin in pixels for the button.
 * @property {string} title - The text to display on the button.
 * @property {React.MouseEventHandler<HTMLButtonElement>} onClick - The click event handler.
 *
 * @param {CustomFabProps} props - The properties for configuring the component.
 * @returns {JSX.Element} The rendered custom floating action button.
 *
 * @remark A default bottom style is applied if `marginBottom` is omitted.
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
