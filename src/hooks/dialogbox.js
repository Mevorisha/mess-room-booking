import { useCallback, useContext } from "react";
import DialogBoxContext from "../contexts/dialogbox.js";

/**
 * @returns {{
 *   isVisible: boolean;
 *   show: (children: React.ReactNode) => void;
 *   hide: () => void;
 * }}
 */
export default function useDialogBox() {
  const { dialogState, setChildren, setOverlayState, setDialogState } =
    useContext(DialogBoxContext);

  const isVisible = dialogState === "scaleIn";

  const show = useCallback(
    /**
     *
     * @param {React.ReactNode} children
     */
    (children) => {
      setChildren(children);
      setOverlayState("fadeIn");
      setDialogState("scaleIn");
    },
    [setChildren, setOverlayState, setDialogState]
  );

  const hide = useCallback(() => {
    setOverlayState("fadeOut");
    setDialogState("scaleOut");
  }, [setOverlayState, setDialogState]);

  return { isVisible, show, hide };
}
