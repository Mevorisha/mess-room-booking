import React, { useState } from "react";
import { lang } from "@/modules/util/language";
import "./styles.css";

/**
 * @param {{
 *   disabled: boolean
 *   onClearClick: React.MouseEventHandler<HTMLElement>
 *   onAddClick: React.MouseEventHandler<HTMLElement>
 * }} props
 * @returns {React.JSX.Element}
 */
function ControlButtons({ disabled, onClearClick, onAddClick }) {
  if (disabled) return;
  return (
    <>
      <i
        onClick={(e) => (!disabled ? onAddClick(e) : () => {})}
        className={`btn-control fa fa-plus ${disabled ? "disabled" : ""}`}
      />
      <i
        onClick={(e) => (!disabled ? onClearClick(e) : () => {})}
        className={`btn-control fa fa-close ${disabled ? "disabled" : ""}`}
      />
    </>
  );
}

/**
 * @param {{
 *   disabled?: boolean
 * }} props
 * @returns {React.JSX.Element}
 */
export function PillInputTest({ disabled }) {
  const [pillsSet, setPillsSet] = useState(new Set());
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

/**
 * @param {{
 *   type?: React.HTMLInputTypeAttribute,
 *   placeholder?: string,
 *   disabled?: boolean,
 *   required?: boolean,
 *   minRequired?: number,
 *   pillsSet: Set<string>,
 *   setPillsSet: React.Dispatch<React.SetStateAction<Set<string>>>
 * }} props
 * @returns {React.JSX.Element}
 */
export default function PillInput({ type, placeholder, disabled, required, minRequired = 1, pillsSet, setPillsSet }) {
  minRequired = minRequired ?? 1;

  const [inputValue, setInputValue] = useState("");

  // Use rewuired property of input element
  // If `required` is set, if pillsSet size > 0, set input.reuquired to false
  // Otherwise, keep it as true (same as `required`)
  let isRequired = required;
  if (required && pillsSet.size >= minRequired) isRequired = false;

  /**
   * @param {string} item
   */
  function handleItemAdd(item) {
    setPillsSet((oldSet) => {
      const newSet = new Set(oldSet);
      item.split(",").forEach((it) => it && newSet.add(it.trim()));
      return newSet;
    });
  }

  /**
   * @param {string} item
   */
  function handleItemRemove(item) {
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

  /**
   * @param {React.KeyboardEvent<HTMLInputElement>} e
   */
  function handleKeyDown(e) {
    if ((e.key === "Enter" || e.key === "Tab") && inputValue.trim()) {
      e.preventDefault();
      handleItemAdd(inputValue.trim());
      setInputValue("");
    }
  }

  function handleAddCurrent() {
    handleItemAdd(inputValue.trim());
    setInputValue("");
  }

  function handleDataScroll(e) {
    e.target.scrollBy({ left: e.deltaY / 4, behavior: "smooth" });
  }

  const additionalPillContainerStyle = pillsSet.size <= 0 ? { padding: "0" } : {};

  return (
    <div className="components-PillsSelect">
      <div className="pills-container" style={additionalPillContainerStyle}>
        {Array.from(pillsSet).map((item, idx) => (
          <div key={idx} className={`pill ${disabled ? "disabled" : ""}`} title={item}>
            <div className="pill-data" onWheel={(e) => handleDataScroll(e)}>
              {item.toString()}
            </div>

            {!disabled && (
              <div className="clearpill-container">
                <i
                  onClick={() => (!disabled ? handleItemRemove(item) : () => {})}
                  className={`btn-control ${disabled ? "disabled" : "fa fa-close"}`}
                />
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
