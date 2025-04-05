import { useCallback, useContext, useRef } from "react";
import DialogBoxContext from "@/contexts/dialogbox.jsx";

/**
 * Hook for using the dialog box system
 * @returns {{
 *   createNewModalId: () => string,
 *   showStacked: (id: string, children: React.JSX.Element, size?: "small" | "large" | "fullwidth") => void,
 *   hideStacked: (id: string) => void,
 *   show: (children: React.JSX.Element, size?: "small" | "large" | "fullwidth") => string,
 *   hide: () => void,
 *   hideTopModal: () => void
 * }}
 */
export default function useDialogBox() {
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
     * @param {"small" | "large" | "fullwidth"} size - Size of the modal
     */
    (id, children, size = "small") => {
      addModal(id, children, size);
    },
    [addModal]
  );

  // New name for hideModal with explicit ID requirement
  const hideStacked = useCallback(
    /**
     * Hide a specific modal by ID
     * @param {string} id - ID of the modal to hide
     */
    (id) => {
      removeModal(id);
    },
    [removeModal]
  );

  // New simplified show function with auto-generated ID
  const show = useCallback(
    /**
     * Show a modal with auto-generated ID
     * @param {React.JSX.Element} children - Content of the modal
     * @param {"small" | "large" | "fullwidth"} size - Size of the modal
     * @returns {string} - The generated ID for the modal
     */
    (children, size = "small") => {
      const id = __mkAutoId();
      addModal(id, children, size);
      return id;
    },
    [addModal, __mkAutoId]
  );

  // New simplified hide function
  const hide = useCallback(() => removeTopModal(), [removeTopModal]);

  // Keep the existing hideTopModal for backwards compatibility
  const hideTopModal = useCallback(() => {
    removeTopModal();
  }, [removeTopModal]);

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
