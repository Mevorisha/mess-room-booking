import React from "react";
import "./styles.css";

/**
 * Renders a custom floating action button.
 *
 * The button displays a text label provided via the `title` prop and applies a dynamic bottom margin based on the `marginBottom` prop
 * (in pixels), defaulting to 20px if no margin is specified. The button triggers the supplied `onClick` callback when clicked.
 *
 * @typedef {Object} CustomFabProps
 * @property {number} marginBottom - Bottom margin of the button in pixels; defaults to 20px if not provided.
 * @property {string} title - The text to display inside the button.
 * @property {React.MouseEventHandler<HTMLButtonElement>} onClick - Callback function invoked when the button is clicked.
 *
 * @param {CustomFabProps} props - Component properties.
 * @returns {JSX.Element} The rendered floating action button element.
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
