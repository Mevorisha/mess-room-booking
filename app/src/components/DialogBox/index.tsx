import React, { useLayoutEffect, useState } from "react";
import "./styles.css";

const DIALOG_ANIM_DURATION = 250;

export interface DialogBoxProps {
  modal: {
    id: string;
    children: React.ReactNode;
    size: "small" | "large" | "uibox";
    overlayState: "fadeIn" | "fadeOut" | "gone";
    dialogState: "scaleIn" | "scaleOut" | "gone";
  };
  onClose: () => void;
}

export default function DialogBox({ modal, onClose }: DialogBoxProps): React.ReactNode {
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

  if (overlayState === "gone" || dialogState === "gone") return <></>;

  const overlayAnimStyle: React.CSSProperties = {
    animation: `${overlayState} ${DIALOG_ANIM_DURATION}ms forwards`,
    cursor: size === "uibox" ? "not-allowed" : "default",
  };

  const dialogAnimStyle: React.CSSProperties = {
    animation: `${dialogState} ${DIALOG_ANIM_DURATION}ms forwards`,
    cursor: "default",
  };

  if (size === "uibox") {
    dialogAnimStyle.maxWidth = `${Math.min(clientDims.w, 1000) - 10}px`;
    dialogAnimStyle.maxHeight = `calc(100vh - ${clientDims.w <= 500 ? 100 : 40}px)`;
    dialogAnimStyle.overflowX = "hidden";
    dialogAnimStyle.overflowY = "auto";
  }

  if (size === "large") {
    dialogAnimStyle.maxWidth = `${Math.min(clientDims.w, 1500) - 20}px`;
    dialogAnimStyle.maxHeight = `calc(100vh - ${clientDims.w <= 500 ? 100 : 40}px)`;
    dialogAnimStyle.width = "fit-content";
  }

  if (size === "small") {
    dialogAnimStyle.maxWidth = `${Math.min(clientDims.w, 400) - 40}px`;
  }

  return (
    <div
      className="components-DialogBox"
      style={overlayAnimStyle}
      onClick={() => {
        if (size === "uibox") return;
        onClose();
      }}
    >
      <div className="dialog-box" style={dialogAnimStyle} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
