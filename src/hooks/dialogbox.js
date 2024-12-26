import { useCallback, useContext } from "react";
import DialogBoxContext from "../contexts/dialogbox.js";

const DIALOG_ANIM_DURATION = 250;

/**
 * @returns {{
 *   isVisible: boolean;
 *   show: (children: React.JSX.Element, size?: "small" | "large") => void;
 *   hide: () => void;
 * }}
 */
export default function useDialogBox() {
  const { dialogState, setChildren, setSize, setOverlayState, setDialogState } =
    useContext(DialogBoxContext);

  const isVisible = dialogState === "scaleIn";

  const show = useCallback(
    /**
     *
     * @param {React.JSX.Element} children
     * @param {"small" | "large"} size
     */
    (children, size = "small") => {
      setSize(size);
      setChildren(children);
      setOverlayState("fadeIn");
      setDialogState("scaleIn");
    },
    [setSize, setChildren, setOverlayState, setDialogState]
  );

  const hide = useCallback(() => {
    setOverlayState("fadeOut");
    setDialogState("scaleOut");
    setTimeout(() => setChildren(null), DIALOG_ANIM_DURATION);
  }, [setChildren, setOverlayState, setDialogState]);

  return { isVisible, show, hide };
}
