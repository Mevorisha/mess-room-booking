import React, { useContext, useLayoutEffect, useState } from "react";
import DialogBoxContext from "@/contexts/dialogbox.jsx";

import "./styles.css";

const DIALOG_ANIM_DURATION = 250;

/**
 * Renders the dialog box with an animated overlay.
 *
 * This component uses context to manage its state, including the dialog's content, animation states, and size settings.
 * It listens for window resize events to update its dimensions and adjusts the dialog's maximum width based on the current "size" setting.
 * When the overlay is clicked, it initiates closing animations and clears the content after the animation duration.
 *
 * @returns {React.JSX.Element | null} The dialog box element with overlay animations, or null if the dialog is inactive.
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
    dialogAnimStyle.overflowY = "auto";
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
