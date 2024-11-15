import { useCallback, useContext } from "react";
import DialogBoxContext from "../contexts/dialogbox.js";

export default function useDialogBox() {
  const { setChildren, setOverlayState, setDialogState } =
    useContext(DialogBoxContext);

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

  return { show, hide };
}
