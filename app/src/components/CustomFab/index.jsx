import React from "react";
import "./styles.css";

/**
 * Renders a custom floating action button with a configurable bottom margin, display text, and click handler.
 *
 * The button's bottom style is set using the provided `marginBottom` prop in pixels, defaulting to "20px" if no value is given. The button displays the specified `title` and invokes the `onClick` function when clicked.
 *
 * @typedef {Object} CustomFabProps
 * @property {number} marginBottom - The bottom margin in pixels for the button (defaults to 20px if not provided).
 * @property {string} title - The text displayed on the button.
 * @property {React.MouseEventHandler<HTMLButtonElement>} onClick - The function called when the button is clicked.
 *
 * @param {CustomFabProps} props - The properties for the custom floating action button.
 * @returns {JSX.Element} The rendered custom floating action button element.
 */
export default function CustomFab({ marginBottom, title, onClick }) {
  const buttonStyle = {
    bottom: marginBottom ? `${marginBottom}px` : "20px",
  };

  return (
    <button className="components-CustomFab" style={buttonStyle} onClick={onClick}>
      <span className="text">{title}</span>
    </button>
  );
}
