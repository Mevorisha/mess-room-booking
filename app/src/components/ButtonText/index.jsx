import React from "react";
import "./styles.css";

/**
 * @param {{
 *   title: string,
 *   onclick?: (e: any) => void,
 *   rounded?: "all" | "left" | "right" | "top" | "bottom" | "none",
 *   kind?: "primary" | "secondary" | "cannibalized",
 *   width?: "default" | "full" | string
 * }} props
 */
export default function ButtonText({
  title,
  onclick,
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
  }

  if (width === "full") {
    width = "100%";
  }
  if (width === "default") {
    width = "auto";
  }

  return (
    <input
      type="submit"
      className={classes.join(" ")}
      onClick={onclick}
      style={{ width, borderRadius: borderRadiusStyle[rounded] }}
      value={title}
    />
  );
}
