import React from "react";
import "./styles.css";

/**
 * Renders a customizable button component.
 *
 * Depending on the `kind` prop, this component displays either a loading spinner or a clickable button that supports form submission. If a form reference is provided via `linkToForm`, clicking the button submits the form—with validation—before invoking the optional `onClick` handler. Inline styles for minimum width, border radius, and colors can be customized using the `width`, `rounded`, and `bgColor` props.
 *
 * @typedef {Object} ButtonTextProps
 * @property {string} title - The text displayed on the button.
 * @property {string} [name] - The button's name, useful when it is part of a form.
 * @property {(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void} [onClick]
 *           - The function to be called upon clicking the button.
 * @property {React.RefObject<HTMLFormElement>} [linkToForm]
 *           - A ref to a form element. If provided, clicking the button submits the form with validations.
 * @property {boolean} [disabled] - Whether the button is disabled.
 * @property {"all" | "left" | "right" | "top" | "bottom" | "none"} [rounded]
 *           - Specifies which corners of the button are rounded.
 * @property {"primary" | "secondary" | "cannibalized" | "loading"} [kind]
 *           - The visual style of the button. Use "loading" to display a spinner.
 * @property {"default" | "full" | string} [width]
 *           - Sets the minimum width of the button; "full" sets it to 100% while "default" uses auto.
 * @property {string} [bgColor] - Defines the background and border color of the button.
 *
 * @param {ButtonTextProps} props - The configuration options for rendering the ButtonText component.
 * @returns {React.JSX.Element} A React element representing the button.
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
