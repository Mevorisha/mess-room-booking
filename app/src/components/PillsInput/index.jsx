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
 * Renders an interactive pill input component.
 *
 * This component displays a list of pills and an input field for adding new pills.
 * The input field's required attribute is dynamically set based on the `required` prop and the number
 * of pills in the set relative to the `minRequired` threshold. Users can add pills by pressing Enter or Tab,
 * remove individual pills using a clear button, or clear all pills at once.
 *
 * @param {Object} props - Component properties.
 * @param {React.HTMLInputTypeAttribute} [props.type] - The input field type.
 * @param {string} [props.placeholder] - Text displayed as a placeholder in the input field.
 * @param {boolean} [props.disabled] - Disables user interactions when true.
 * @param {boolean} [props.required] - Marks the input field as required until the number of pills reaches `minRequired`.
 * @param {number} [props.minRequired=1] - The minimum number of pills to satisfy the requirement for the input field.
 * @param {Set<string>} props.pillsSet - The current set of pill values.
 * @param {React.Dispatch<React.SetStateAction<Set<string>>>} props.setPillsSet - Function to update the pills set.
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
