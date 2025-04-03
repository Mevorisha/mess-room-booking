import React, { useState } from "react";
import "./styles.css";

/**
 * @param {{
 *   disabled: boolean
 *   onClick: React.MouseEventHandler<HTMLElement>
 * }} props
 * @returns {React.JSX.Element}
 */
function CrossButton({ disabled, onClick }) {
  if (disabled) {
    return <i className="btn-clear disabled fa fa-close" />;
  }
  return <i onClick={(e) => onClick(e)} className="btn-clear fa fa-close" />;
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
      newSet.add(item);
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

  function handleDataScroll(e) {
    e.target.scrollBy({ left: e.deltaY / 4, behavior: "smooth" });
  }

  const additionalPillContainerStyle = pillsSet.size <= 0 ? { padding: "0" } : {};

  return (
    <div className="components-PillsSelect">
      <div className="pills-container" style={additionalPillContainerStyle}>
        {Array.from(pillsSet).map((item, idx) => (
          <div key={idx} className="pill">
            <div className="pill-data" onWheel={(e) => handleDataScroll(e)}>
              {item.toString()}
            </div>

            <div className="clearpill-container clearbtn-container">
              <CrossButton disabled={!!disabled} onClick={() => handleItemRemove(item)} />
            </div>
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
          placeholder={!disabled ? placeholder : "View only"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e)}
          style={{ border: "none" }}
        />

        <div className="clearall-container clearbtn-container">
          <CrossButton disabled={!!disabled} onClick={handleClearAll} />
        </div>
      </div>
    </div>
  );
}
