import React, { createContext, useState } from "react";
import DialogBox from "@/components/DialogBox";

const DialogBoxContext = createContext({
  modalStack: /** @type {Array<{id: string, children: React.JSX.Element, size: "small" | "large" | "uibox"}>} */ ([]),
  addModal: /** @type {(id: string, children: React.JSX.Element, size: "small" | "large" | "uibox") => void} */ (
    () => {}
  ),
  removeModal: /** @type {(id: string) => void} */ (() => {}),
  removeTopModal: /** @type {() => void} */ (() => {}),
});

export default DialogBoxContext;

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export function DialogBoxProvider({ children }) {
  const [modalStack, setModalStack] = useState(
    /** @type {Array<{
    id: string,
    children: React.JSX.Element, 
    size: "small" | "large" | "uibox",
    overlayState: "fadeIn" | "fadeOut" | "gone",
    dialogState: "scaleIn" | "scaleOut" | "gone"
  }>} */ ([])
  );

  /**
   * Add a new modal to the stack
   * @param {string} id - Unique identifier for the modal
   * @param {React.JSX.Element} modalChildren - Content of the modal
   * @param {"small" | "large" | "uibox"} size - Size of the modal
   */
  const addModal = (id, modalChildren, size = "small") => {
    setModalStack((prevStack) => [
      ...prevStack,
      {
        id,
        children: modalChildren,
        size,
        overlayState: "fadeIn",
        dialogState: "scaleIn",
      },
    ]);
  };

  /**
   * Remove a specific modal from the stack by ID
   * @param {string} id - ID of the modal to remove
   */
  const removeModal = (id) => {
    const modalIndex = modalStack.findIndex((modal) => modal.id === id);

    if (modalIndex !== -1) {
      const newStack = [...modalStack];
      newStack[modalIndex] = {
        ...newStack[modalIndex],
        overlayState: "fadeOut",
        dialogState: "scaleOut",
      };

      setModalStack(newStack);

      // Remove the modal from the stack after animation completes
      setTimeout(() => {
        setModalStack((prevStack) => prevStack.filter((modal) => modal.id !== id));
      }, 250);
    }
  };

  /**
   * Remove the topmost modal from the stack
   */
  const removeTopModal = () => {
    if (modalStack.length > 0) {
      const topModalId = modalStack[modalStack.length - 1].id;
      removeModal(topModalId);
    }
  };

  return (
    <DialogBoxContext.Provider
      value={{
        modalStack,
        addModal,
        removeModal,
        removeTopModal,
      }}
    >
      {children}
      {modalStack.map((modal, index) => (
        <DialogBox key={modal.id} modal={modal} onClose={() => removeModal(modal.id)} />
      ))}
    </DialogBoxContext.Provider>
  );
}
