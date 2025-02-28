import React, { createContext, useState } from "react";
import DialogBox from "../components/DialogBox";

const DialogBoxContext = createContext({
  children: /** @type {React.JSX.Element | null} */ (null),
  setChildren: /** @type {(val: React.JSX.Element | null) => void} */ (() => {}),

  overlayState: /** @type {"fadeIn" | "fadeOut" | "gone"} */ ("gone"),
  setOverlayState: /** @type {(val: "fadeIn" | "fadeOut" | "gone") => void} */ (() => {}),

  size: /** @type {"small" | "large" | "fullwidth"} */ ("small"),
  setSize: /** @type {(val: "small" | "large" | "fullwidth") => void} */ (() => {}),

  dialogState: /** @type {"scaleIn" | "scaleOut" | "gone"} */ ("gone"),
  setDialogState: /** @type {(val: "scaleIn" | "scaleOut" | "gone") => void} */ (() => {}),
});

export default DialogBoxContext;

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export function DialogBoxProvider({ children }) {
  const [overlayState, setOverlayState] = useState(/** @type {"fadeIn" | "fadeOut" | "gone"} */ ("gone"));

  const [dialogState, setDialogState] = useState(/** @type {"scaleIn" | "scaleOut" | "gone"} */ ("gone"));

  const [size, setSize] = useState(/** @type {"small" | "large" | "fullwidth"} */ ("small"));

  const [children_, setChildren_] = useState(/** @type {React.JSX.Element | null} */ (null));

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
