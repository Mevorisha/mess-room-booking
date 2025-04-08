import React, { useLayoutEffect, useState } from "react";
import "./styles.css";

const DIALOG_ANIM_DURATION = 250;

/**
 * @param {{
 *   modal: {
 *     id: string,
 *     children: React.JSX.Element,
 *     size: "small" | "large" | "fullwidth",
 *     overlayState: "fadeIn" | "fadeOut" | "gone",
 *     dialogState: "scaleIn" | "scaleOut" | "gone"
 *   },
 *   onClose: () => void
 * }} props
 * @returns {React.JSX.Element | null}
 */
export default function DialogBox({ modal, onClose }) {
  const { children, size, overlayState, dialogState } = modal;

  const [clientDims, setClientDims] = useState({
    w: document.body.clientWidth,
    h: document.body.clientHeight,
  });

  useLayoutEffect(() => {
    const updateClientDims = () =>
      setClientDims({
        w: document.body.clientWidth,
        h: document.body.clientHeight,
      });

    window.addEventListener("resize", updateClientDims);
    return () => window.removeEventListener("resize", updateClientDims);
  }, []);

  if (overlayState === "gone" || dialogState === "gone") return null;

  const overlayAnimStyle = {
    animation: `${overlayState} ${DIALOG_ANIM_DURATION}ms forwards`,
    cursor: size === "fullwidth" ? "not-allowed" : "default",
  };

  const dialogAnimStyle = {
    animation: `${dialogState} ${DIALOG_ANIM_DURATION}ms forwards`,
    cursor: "default",
  };

  if (size === "fullwidth") {
    dialogAnimStyle.maxWidth = `${Math.min(clientDims.w, 1000) - 10}px`;
    dialogAnimStyle.maxHeight = `calc(100vh - ${clientDims.w <= 500 ? 100 : 40}px)`;
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
        if (size === "fullwidth") return;
        onClose();
      }}
    >
      <div className="dialog-box" style={dialogAnimStyle} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
