import React from "react";
import "./styles.css";

/**
 * Renders a customizable button that can submit a form with validation and display a loading spinner.
 *
 * This component displays an input button with configurable text, styling, and behavior.
 * If a form reference is provided via `linkToForm`, clicking the button will trigger the form's submission
 * and run validation before executing any additional click logic. When the `kind` prop is set to "loading",
 * a spinner is displayed instead of the interactive button.
 *
 * @typedef {Object} ButtonTextProps
 * @property {string} title - The text displayed on the button.
 * @property {string} [name] - The name attribute for the button input, useful for form integration.
 * @property {(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void} [onClick] - Callback triggered on button click.
 * @property {React.RefObject<HTMLFormElement>} [linkToForm] - A form ref; if provided, the button submits the form with validation.
 * @property {boolean} [disabled] - Disables the button when true.
 * @property {"all" | "left" | "right" | "top" | "bottom" | "none"} [rounded] - Specifies which corners of the button are rounded.
 * @property {"primary" | "secondary" | "cannibalized" | "loading"} [kind] - Defines the button's style; "loading" displays a spinner.
 * @property {"default" | "full" | string} [width] - Sets the minimum width of the button with special handling for "full" and "default".
 * @property {string} [bgColor] - Custom background and border color for the button.
 *
 * @param {ButtonTextProps} props - The properties for configuring the button.
 * @returns {React.JSX.Element} The rendered button component.
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
