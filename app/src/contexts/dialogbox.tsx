import React, { createContext, useState } from "react";
import DialogBox from "@/components/DialogBox";

export interface ModalData {
  id: string;
  children: React.ReactNode;
  size: "small" | "large" | "uibox";
  overlayState: "fadeIn" | "fadeOut" | "gone";
  dialogState: "scaleIn" | "scaleOut" | "gone";
}

const DialogBoxContext = createContext({
  modalStack: [] as ModalData[],
  addModal: ((): void => void 0) as (
    id: string,
    modalChildren: React.ReactNode,
    size: "small" | "large" | "uibox"
  ) => void,
  removeModal: ((): void => void 0) as (id: string) => void,
  removeTopModal: ((): void => void 0) as () => void,
  setContent: ((): void => void 0) as (
    id: string,
    modalChildren: React.ReactNode,
    size?: "small" | "large" | "uibox"
  ) => void,
});

export default DialogBoxContext;

export function DialogBoxProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const [modalStack, setModalStack] = useState<ModalData[]>([]);

  /**
   * Add a new modal to the stack
   */
  function addModal(id: string, modalChildren: React.ReactNode, size: "small" | "large" | "uibox" = "small") {
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
  function removeTopModal() {
    if (modalStack.length > 0) {
      const topModalId = modalStack[modalStack.length - 1]?.id ?? "";
      removeModal(topModalId);
    }
  }

  function setContent(id: string, modalChildren: React.ReactNode, size?: "small" | "large" | "uibox"): void {
    setModalStack((oldSack) => {
      const newStack = [...oldSack];
      const idx = newStack.findIndex((v) => v.id === id);
      if (idx === -1) return oldSack;
      (newStack[idx] as ModalData).children = modalChildren;
      (newStack[idx] as ModalData).size = size ?? (newStack[idx] as ModalData).size;
      return newStack;
    });
  }

  return (
    <DialogBoxContext.Provider
      value={{
        modalStack,
        addModal,
        removeModal,
        removeTopModal,
        setContent,
      }}
    >
      {children}
      {modalStack.map((modal, _index) => (
        <DialogBox key={modal.id} modal={modal} onClose={() => removeModal(modal.id)} />
      ))}
    </DialogBoxContext.Provider>
  );
}
