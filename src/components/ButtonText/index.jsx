import React from "react";
import "./styles.css";

/**
 * @typedef {Object} ButtonTextProps
 * @property {string} title                                                   - The text to be displayed on the button.
 * @property {(
 *   event: React.MouseEvent<HTMLDivElement, MouseEvent>
 * ) => void} [onClick]                                                       - The function to be called when the button is clicked. Second argument is a
 *                                                                              function to stop the spinning animation.
 * @property {React.RefObject<HTMLFormElement>} [linkToForm]                  - A ref using `useRef` to the form to be submitted when the button is clicked.
 *                                                                              If provided, the button will submit the form when clicked with validations.
 * @property {"all" | "left" | "right" | "top" | "bottom" | "none"} [rounded] - The placement of rounded corners on the button.
 * @property {"primary" | "secondary" | "cannibalized" | "loading"} [kind]    - The kind of button. Primary has background and border, secondary has
 *                                                                              light background and light border, cannibalized has no background and no border.
 *                                                                              Loading is a special kind that shows a spinning animation.
 * @property {"default" | "full" | string} [width]                            - The minimum width of the button in CSS units. To use less width, encapsulate the
 *                                                                              button in a container with the desired width.
 *
 * @param {ButtonTextProps} props
 * @return {React.JSX.Element}
 */
export default function ButtonText({
  title,
  onClick,
  linkToForm,
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
      <div
        className="components-ButtonText-loading"
        style={{ minWidth, borderRadius: borderRadiusStyle[rounded] }}
      >
        <div className="circle"></div>
      </div>
    );
  }

  return (
    <div
      className={classes.join(" ")}
      style={{ minWidth, borderRadius: borderRadiusStyle[rounded] }}
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
        style={{ borderRadius: borderRadiusStyle[rounded] }}
        type="submit"
        value={title}
      />
    </div>
  );
}
