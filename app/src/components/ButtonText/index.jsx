import React from "react";
import "./styles.css";

/**
 * @param {{
 *   title: string,
 *   onclick: () => void,
 *   rounded?: boolean,
 *   kind?: "primary" | "secondary",
 * }} props
 */
export default function ButtonText({
  title,
  onclick,
  rounded = false,
  kind = "primary",
}) {
  let classes = [];
  if (rounded) {
    classes.push("ButtonText-rounded");
  }

  if (kind === "primary") {
    classes.push("ButtonText-primary");
  } else if (kind === "secondary") {
    classes.push("ButtonText-secondary");
  }

  return (
    <button className={classes.join(" ")} onClick={onclick}>
      {title}
    </button>
  );
}
