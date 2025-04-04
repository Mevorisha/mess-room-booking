import React, { useContext, useLayoutEffect, useState } from "react";
import DialogBoxContext from "@/contexts/dialogbox.jsx";

import "./styles.css";

const DIALOG_ANIM_DURATION = 250;

/**
 * Renders an animated dialog overlay that adapts to viewport size and context state.
 *
 * This component uses context to determine the content, visibility, animation state, and sizing of the dialog box. It listens for window resize events to update its dimensions and conditionally renders the overlay and dialog based on state values:
 * - Returns null if the overlay or dialog state is "gone".
 * - Applies animation styles defined by the current overlay and dialog states.
 * - Adjusts dialog dimensions responsively based on the provided "size" ("fullwidth", "large", or "small").
 *
 * Clicking the overlay initiates fade-out and scale-out animations and eventually clears the dialog content after the animation duration.
 *
 * @returns {React.JSX.Element | null} The animated dialog overlay element, or null if it should not be displayed.
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
