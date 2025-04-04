import React from "react";
import "./styles.css";

/**
 * Renders a customizable button with various styles and optional form submission handling.
 *
 * The component adjusts its styling based on the provided properties. It supports a loading state
 * (displaying a spinner), and if a form reference is supplied via {@link linkToForm}, it attempts to
 * submit the form with validation. A custom click handler can also be provided and is invoked after
 * the form submission logic.
 *
 * @typedef {Object} ButtonTextProps
 * @property {string} title - The text to display on the button.
 * @property {string} [name] - The name attribute for the button, useful when included in forms.
 * @property {(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void} [onClick] - Optional click handler that receives the click event.
 * @property {React.RefObject<HTMLFormElement>} [linkToForm] - Optional reference to a form element used for submission with validation.
 * @property {boolean} [disabled] - Indicates whether the button should be disabled.
 * @property {"all" | "left" | "right" | "top" | "bottom" | "none"} [rounded] - Specifies which corners should be rounded.
 * @property {"primary" | "secondary" | "cannibalized" | "loading"} [kind] - Determines the button style; the "loading" type displays a spinner.
 * @property {"default" | "full" | string} [width] - Sets the minimum width of the button; "full" translates to 100% width and "default" to auto.
 * @property {string} [bgColor] - The background and border color applied to the button.
 *
 * @param {ButtonTextProps} props - The properties to configure the button.
 * @returns {React.JSX.Element} The rendered button element.
 */
export default function ButtonText({
  title,
  name,
  onClick,
  linkToForm,
  disabled,
  bgColor,
  rounded = "none",
  kind = "primary",
  width = "default",
}) {
  let classes = [];
  let borderRadiusStyle = {
    all: "var(--rounded-rad)",
    left: "var(--rounded-rad) 0 0 var(--rounded-rad)",
    right: "0 var(--rounded-rad) var(--rounded-rad) 0",
    top: "var(--rounded-rad) var(--rounded-rad) 0 0",
    bottom: "0 0 var(--rounded-rad) var(--rounded-rad)",
    none: "0",
  };

  if (kind === "primary") {
    classes.push("components-ButtonText-primary");
  } else if (kind === "secondary") {
    classes.push("components-ButtonText-secondary");
  } else if (kind === "cannibalized") {
    classes.push("components-ButtonText-cannibalized");
  } else if (kind === "loading") {
    classes.push("components-ButtonText-loading");
  }

  let minWidth = /** @type {string} */ (width);

  if (minWidth === "full") {
    minWidth = "100%";
  }
  if (minWidth === "default") {
    minWidth = "auto";
  }

  // whatever be the width, subtract 2 * var(--pad-2) from it
  minWidth = `calc(${width} - 2 * var(--pad-2))`;

  if (kind === "loading") {
    return (
      <div className="components-ButtonText-loading" style={{ minWidth, borderRadius: borderRadiusStyle[rounded] }}>
        <div className="circle"></div>
      </div>
    );
  }

  return (
    <div
      className={classes.join(" ")}
      style={{ minWidth, borderRadius: borderRadiusStyle[rounded], backgroundColor: bgColor, borderColor: bgColor }}
      onClick={(event) => {
        if (linkToForm?.current) {
          // if form present, submit with validations
          linkToForm.current.requestSubmit();
          // if not valid, stop here
          if (!linkToForm.current.reportValidity()) return;
        }
        // finally, perform additional tasks if provided
        if (onClick) onClick(event);
      }}
    >
      <input
        name={name}
        disabled={disabled}
        style={{ borderRadius: borderRadiusStyle[rounded] }}
        type="submit"
        value={title}
      />
    </div>
  );
}
