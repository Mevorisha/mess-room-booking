import { useCallback, useContext, useRef } from "react";
import DialogBoxContext from "@/contexts/dialogbox.jsx";

export interface DialogBoxHookType {
  createNewModalId: () => string;
  showStacked: (id: string, children: React.JSX.Element, size?: "small" | "large" | "uibox") => void;
  hideStacked: (id: string) => void;
  hideTopModal: () => void;
  show: (children: React.JSX.Element, size?: "small" | "large" | "uibox") => string;
  hide: () => void;
}

/**
 * Hook for using the dialog box system
 */
export default function useDialog(): DialogBoxHookType {
  const { addModal, removeModal, removeTopModal } = useContext(DialogBoxContext);
  const idCounterRef = useRef(0);



  // Generate a unique ID for auto-generated modals
  const __mkAutoId = useCallback(() => {
    idCounterRef.current += 1;
    return `auto-modal-${idCounterRef.current}`;
  }, []);

  const createNewModalId = useCallback(() => "modal-" + Date.now() + "-" + Math.floor(Math.random() * 1000), []);

  // New name for showModal with explicit ID requirement
  const showStacked = useCallback(
    /**
     * Show a modal with the given content and explicit ID
     * @param {string} id - Unique identifier for the modal
     * @param {React.JSX.Element} children - Content of the modal
     * @param {"small" | "large" | "uibox"} size - Size of the modal
     */
    (id: string, children: React.JSX.Element, size: "small" | "large" | "uibox" = "small") => {
      addModal(id, children, size);
    },
    [addModal]
  );

  // New name for hideModal with explicit ID requirement
  const hideStacked = useCallback(
    /**
     * Hide a specific modal by ID
     */
    (id: string, onHide?: () => void) => {
      removeModal(id);
      if (onHide != null) onHide();
    },
    [removeModal]
  );

  // New simplified show function with auto-generated ID
  const show = useCallback(
    /**
     * Show a modal with auto-generated ID
     * @param {React.JSX.Element} children - Content of the modal
     * @param {"small" | "large" | "uibox"} size - Size of the modal
     * @returns {string} - The generated ID for the modal
     */
    (children: React.JSX.Element, size: "small" | "large" | "uibox" = "small"): string => {
      const id = __mkAutoId();
      addModal(id, children, size);
      return id;
    },
    [addModal, __mkAutoId]
  );

  // New simplified hide function
  const hide = useCallback(
    (onHide?: () => void) => {
      removeTopModal();
      if (onHide != null) onHide();
    },
    [removeTopModal]
  );

  // Keep the existing hideTopModal for backwards compatibility
  const hideTopModal = useCallback(
    (onHide?: () => void) => {
      removeTopModal();
      if (onHide != null) onHide();
    },
    [removeTopModal]
  );

  return {
    // New API for stacked modals
    createNewModalId,
    showStacked,
    hideStacked,
    hideTopModal,
    // Legacy API
    show,
    hide,
  };
}
