import React, { useContext } from "react";
import DialogBoxContext from "../../contexts/dialogbox";

import "./styles.css";

const DIALOG_ANIM_DURATION = 250;

export default function DialogBox() {
  const {
    children,
    overlayState,
    dialogState,
    setOverlayState,
    setDialogState,
  } = useContext(DialogBoxContext);

  if (overlayState === "gone") return null;
  if (dialogState === "gone") return null;

  const overlayAnimStyle = {
    animation: `${overlayState} ${DIALOG_ANIM_DURATION}ms forwards`,
  };

  const dialogAnimStyle = {
    animation: `${dialogState} ${DIALOG_ANIM_DURATION}ms forwards`,
  };

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
