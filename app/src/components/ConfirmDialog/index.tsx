import React from "react";
import useDialogBox from "@/hooks/dialogbox";
import ButtonText from "../ButtonText";
import { lang } from "@/modules/util/language";

export interface ConfirmDialogProps {
  title: string;
  text: string;
  onConfirm: () => void;
}

export default function ConfirmDialog({ title, text, onConfirm: handleConfirmClick }: ConfirmDialogProps): React.ReactNode {
  const dialog = useDialogBox();

  return (
    <div className="form-container" style={{ padding: "var(--pad-5)" }}>
      <h2>{title}</h2>
      <p style={{ textAlign: "justify" }}>{text}</p>
      <div
        style={{
          marginTop: "var(--pad-5)",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ButtonText
          title={lang("Confirm", "কনফার্ম", "कन्फर्म")}
          rounded="all"
          kind="primary"
          width="50%"
          onClick={() => {
            handleConfirmClick();
            dialog.hide();
          }}
        />
      </div>
    </div>
  );
}
