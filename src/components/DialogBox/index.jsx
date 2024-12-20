import React, { useContext, useLayoutEffect, useState } from "react";
import DialogBoxContext from "../../contexts/dialogbox";

import "./styles.css";

const DIALOG_ANIM_DURATION = 250;

export default function DialogBox() {
  const {
    children,
    overlayState,
    dialogState,
    size,
    setOverlayState,
    setDialogState,
  } = useContext(DialogBoxContext);

  const [clientWidth, setClientWidth] = useState(document.body.clientWidth);

  useLayoutEffect(() => {
    const updateClientWidth = () => setClientWidth(document.body.clientWidth);
    window.addEventListener("resize", updateClientWidth);
    return () => window.removeEventListener("resize", updateClientWidth);
  }, []);

  if (overlayState === "gone") return null;
  if (dialogState === "gone") return null;

  const overlayAnimStyle = {
    animation: `${overlayState} ${DIALOG_ANIM_DURATION}ms forwards`,
  };

  const dialogAnimStyle = {
    animation: `${dialogState} ${DIALOG_ANIM_DURATION}ms forwards`,
  };

  if (size === "large") {
    dialogAnimStyle.maxWidth = `${Math.min(clientWidth, 500) - 40}px`;
  }

  if (size === "small") {
    dialogAnimStyle.maxWidth = `${Math.min(clientWidth, 400) - 40}px`;
  }

  return (
    <div
      className="components-DialogBox"
      style={overlayAnimStyle}
      onClick={() => {
        setOverlayState("fadeOut");
        setDialogState("scaleOut");
      }}
    >
      <div
        className="dialog-box"
        style={dialogAnimStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
