import React, { useState } from "react";
import { lang } from "@/modules/util/language";
import "./styles.css";

export interface ControlButtonsProps {
  disabled: boolean;
  onClearClick: React.MouseEventHandler<HTMLElement>;
  onAddClick: React.MouseEventHandler<HTMLElement>;
}

function ControlButtons({ disabled, onClearClick, onAddClick }: ControlButtonsProps): React.ReactNode {
  if (disabled) return <></>;
  return (
    <>
      <i onClick={(e) => onAddClick(e)} className="btn-control fa fa-plus" />
      <i onClick={(e) => onClearClick(e)} className="btn-control fa fa-close" />
    </>
  );
}

export function PillInputTest({ disabled = false }: { disabled?: boolean }): React.ReactNode {
  const [pillsSet, setPillsSet] = useState(new Set<string>());
  return (
    <PillInput
      type="text"
      placeholder="Enter demo values"
      disabled={disabled}
      pillsSet={pillsSet}
      setPillsSet={setPillsSet}
    />
  );
}

export interface PillInputProps {
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  minRequired?: number;
  pillsSet: Set<string>;
  setPillsSet: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export default function PillInput({
  type,
  placeholder,
  disabled = false,
  required = false,
  minRequired = 1,
  pillsSet,
  setPillsSet,
}: PillInputProps): React.ReactNode {
  const [inputValue, setInputValue] = useState("");

  // Use rewuired property of input element
  // If `required` is set, if pillsSet size > 0, set input.reuquired to false
  // Otherwise, keep it as true (same as `required`)
  let isRequired = required;
  if (required && pillsSet.size >= minRequired) isRequired = false;

  function handleItemAdd(item: string) {
    setPillsSet((oldSet) => {
      const newSet = new Set(oldSet);
      item.split(",").forEach((it) => it !== "" && newSet.add(it.trim()));
      return newSet;
    });
  }

  function handleItemRemove(item: string) {
    setPillsSet((oldSet) => {
      const newSet = new Set(oldSet);
      newSet.delete(item);
      return newSet;
    });
  }

  function handleClearAll() {
    setPillsSet((oldSet) => {
      const newSet = new Set(oldSet);
      newSet.clear();
      return newSet;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Enter or Tab not registerd in Mobile (Android/Chrome)
    if ((e.key === "Enter" || e.key === "Tab" || e.keyCode === 13) && inputValue.trim().length > 0) {
      e.preventDefault();
      handleItemAdd(inputValue.trim());
      setInputValue("");
    }
  }

  function handleAddCurrent() {
    handleItemAdd(inputValue.trim());
    setInputValue("");
  }

  const additionalPillContainerStyle = pillsSet.size <= 0 ? { padding: "0" } : {};

  return (
    <div className="components-PillsSelect">
      <div className="pills-container" style={additionalPillContainerStyle}>
        {Array.from(pillsSet).map((item, idx) => (
          <div key={idx} className={`pill ${disabled ? "disabled" : ""}`} title={item}>
            <div className="pill-data">{item.toString()}</div>

            {!disabled && (
              <div className="clearpill-container">
                <i onClick={() => handleItemRemove(item)} className="btn-control fa fa-close" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="editing-container">
        <input
          required={isRequired}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          tabIndex={0}
          type={type}
          disabled={disabled}
          placeholder={!disabled ? placeholder : lang("View only", "শুধু দেখার জন্য", "सिर्फ़ देखने के लिए")}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e)}
          style={{ border: "none" }}
        />

        <div className="clearall-container clearbtn-container">
          <ControlButtons disabled={!!disabled} onAddClick={handleAddCurrent} onClearClick={handleClearAll} />
        </div>
      </div>
    </div>
  );
}
