import React, { useContext, useLayoutEffect, useState } from "react";
import DialogBoxContext from "../../contexts/dialogbox.js";

import "./styles.css";

const DIALOG_ANIM_DURATION = 250;

/**
 * @returns {React.JSX.Element | null}
 */
export default function DialogBox() {
  const { children, setChildren, overlayState, dialogState, size, setOverlayState, setDialogState } =
    useContext(DialogBoxContext);

  const [clientDims, setClientDims] = useState({
    w: document.body.clientWidth,
    h: document.body.clientHeight,
  });

  useLayoutEffect(() => {
    const updateClientDims = () =>
      setClientDims({
        w: document.body.clientWidth,
        h: document.body.clientHeight, // no change in height on resize - redundant
      });

    window.addEventListener("resize", updateClientDims);
    return () => window.removeEventListener("resize", updateClientDims);
  }, []);

  if (overlayState === "gone") return null;
  if (dialogState === "gone") return null;

  const overlayAnimStyle = {
    animation: `${overlayState} ${DIALOG_ANIM_DURATION}ms forwards`,
  };

  const dialogAnimStyle = {
    animation: `${dialogState} ${DIALOG_ANIM_DURATION}ms forwards`,
  };

  if (size === "fullwidth") {
    dialogAnimStyle.maxWidth = `${Math.min(clientDims.w, 1000) - 10}px`;
    dialogAnimStyle.maxHeight = "calc(100vh - 40px)";
    dialogAnimStyle.overflowX = "hidden";
    dialogAnimStyle.overflowY = "hidden";
  }

  if (size === "large") {
    dialogAnimStyle.maxWidth = `${Math.min(clientDims.w, 500) - 40}px`;
  }

  if (size === "small") {
    dialogAnimStyle.maxWidth = `${Math.min(clientDims.w, 400) - 40}px`;
  }

  return (
    <div
      className="components-DialogBox"
      style={overlayAnimStyle}
      onClick={() => {
        setOverlayState("fadeOut");
        setDialogState("scaleOut");
        setTimeout(() => setChildren(null), DIALOG_ANIM_DURATION);
      }}
    >
      <div className="dialog-box" style={dialogAnimStyle} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
