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
 * Renders an interactive pill input interface.
 *
 * This component displays a container with pill items derived from the provided set and an input field for adding new items.
 * It allows users to add pills by pressing the Enter or Tab key, remove individual pills, and clear all pills. The input's
 * required attribute is dynamically set based on the initial required flag and the current number of pills relative to the
 * specified minimum required count.
 *
 * @param {object} props - The component properties.
 * @param {React.HTMLInputTypeAttribute} [props.type] - The HTML input type attribute.
 * @param {string} [props.placeholder] - The placeholder text for the input field when enabled.
 * @param {boolean} [props.disabled] - If true, disables the input field and pill interactions.
 * @param {boolean} [props.required] - Indicates if the input should initially be required.
 * @param {number} [props.minRequired=1] - The minimum number of pills required for the input to no longer be marked as required.
 * @param {Set<string>} props.pillsSet - A set containing the current pill items.
 * @param {React.Dispatch<React.SetStateAction<Set<string>>>} props.setPillsSet - State updater for modifying the pills set.
 * @returns {React.JSX.Element} The rendered pill input component.
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
