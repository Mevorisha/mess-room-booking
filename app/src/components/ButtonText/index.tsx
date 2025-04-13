import React from "react";
import "./styles.css";

export interface ButtonTextProps {
  title: string;
  name?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  linkToForm?: React.RefObject<HTMLFormElement>;
  disabled?: boolean;
  rounded?: "all" | "left" | "right" | "top" | "bottom" | "none";
  kind?: "primary" | "secondary" | "cannibalized" | "loading";
  width?: string;
  bgColor?: string;
}

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
}: ButtonTextProps): React.JSX.Element {
  const classes = [];
  const borderRadiusStyle = {
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
  } else {
    classes.push("components-ButtonText-loading");
  }

  let minWidth: string = width;

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
        if (linkToForm?.current != null) {
          // if form present, submit with validations
          linkToForm.current.requestSubmit();
          // if not valid, stop here
          if (!linkToForm.current.reportValidity()) return;
        }
        // finally, perform additional tasks if provided
        if (onClick != null) onClick(event);
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
