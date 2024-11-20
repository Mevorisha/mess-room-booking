import React, { createContext, useState } from "react";
import DialogBox from "../components/DialogBox";

const DialogBoxContext = createContext({
  children: /** @type {React.ReactNode | null} */ (null),
  setChildren: /** @type {(val: React.ReactNode | null) => void} */ (() => {}),

  overlayState: /** @type {"fadeIn" | "fadeOut" | "gone"} */ ("gone"),
  setOverlayState: /** @type {(val: "fadeIn" | "fadeOut" | "gone") => void} */ (
    () => {}
  ),

  size: /** @type {"small" | "large"} */ ("small"),
  setSize: /** @type {(val: "small" | "large") => void} */ (() => {}),

  dialogState: /** @type {"scaleIn" | "scaleOut" | "gone"} */ ("gone"),
  setDialogState:
    /** @type {(val: "scaleIn" | "scaleOut" | "gone") => void} */ (() => {}),
});

export default DialogBoxContext;

export function DialogBoxProvider({ children }) {
  const [overlayState, setOverlayState] = useState(
    /** @type {"fadeIn" | "fadeOut" | "gone"} */ ("gone")
  );

  const [dialogState, setDialogState] = useState(
    /** @type {"scaleIn" | "scaleOut" | "gone"} */ ("gone")
  );

  const [size, setSize] = useState(/** @type {"small" | "large"} */ ("small"));

  const [children_, setChildren_] = useState(
    /** @type {React.ReactNode | null} */ (null)
  );

  return (
    <DialogBoxContext.Provider
      value={{
        children: children_,
        setChildren: setChildren_,

        overlayState,
        setOverlayState,

        size,
        setSize,

        dialogState,
        setDialogState,
      }}
    >
      {children}
      <DialogBox />
    </DialogBoxContext.Provider>
  );
}
