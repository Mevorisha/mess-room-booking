import React, { createContext, useState } from "react";
import DialogBox from "@/components/DialogBox";

export interface ModalData {
  id: string;
  children: React.JSX.Element;
  size: "small" | "large" | "uibox";
  overlayState: "fadeIn" | "fadeOut" | "gone";
  dialogState: "scaleIn" | "scaleOut" | "gone";
}

const DialogBoxContext = createContext({
  modalStack: [] as ModalData[],
  addModal: ((): void => void 0) as (
    id: string,
    children: React.JSX.Element,
    size: "small" | "large" | "uibox"
  ) => void,
  removeModal: ((): void => void 0) as (id: string) => void,
  removeTopModal: ((): void => void 0) as () => void,
});

export default DialogBoxContext;

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export function DialogBoxProvider({ children }: { children: React.JSX.Element }): React.JSX.Element {
  const [modalStack, setModalStack] = useState<ModalData[]>([]);

  /**
   * Add a new modal to the stack
   */
  function addModal(id: string, modalChildren: React.JSX.Element, size: "small" | "large" | "uibox" = "small") {
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
  }

  /**
   * Remove a specific modal from the stack by ID
   */
  function removeModal(id: string) {
    const modalIndex = modalStack.findIndex((modal) => modal.id === id);

    if (modalIndex !== -1) {
      setModalStack((oldStack) => {
        const newStack = [...oldStack];
        newStack[modalIndex] = {
          id: newStack[modalIndex]?.id ?? "",
          children: newStack[modalIndex]?.children ?? <></>,
          size: newStack[modalIndex]?.size ?? "small",
          overlayState: "fadeOut",
          dialogState: "scaleOut",
        };
        return newStack;
      });

      // Remove the modal from the stack after animation completes
      setTimeout(() => {
        setModalStack((prevStack) => prevStack.filter((modal) => modal.id !== id));
      }, 250);
    }
  }

  /**
   * Remove the topmost modal from the stack
   */
  const removeTopModal = () => {
    if (modalStack.length > 0) {
      const topModalId = modalStack[modalStack.length - 1]?.id ?? "";
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
      {modalStack.map((modal, _index) => (
        <DialogBox key={modal.id} modal={modal} onClose={() => removeModal(modal.id)} />
      ))}
    </DialogBoxContext.Provider>
  );
}
