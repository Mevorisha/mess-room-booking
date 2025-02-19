import React, { useState } from "react";
import "./styles.css";

/**
 * @param {{
 *   onClick: React.MouseEventHandler<HTMLElement>
 * }} props
 * @returns {React.JSX.Element}
 */
function CrossButton({ onClick }) {
  return <i onClick={(e) => onClick(e)} className="btn-close fa fa-close" />;
}

export function PillInputTest() {
  const [pillsSet, setPillsSet] = useState(new Set());
  return <PillInput pillsSet={pillsSet} setPillsSet={setPillsSet} />;
}

/**
 * @param {{
 *   pillsSet: Set<string>,
 *   setPillsSet: React.Dispatch<React.SetStateAction<Set<string>>>
 * }} props
 * @returns {React.JSX.Element}
 */
export default function PillInput({ pillsSet, setPillsSet }) {
  const [inputValue, setInputValue] = useState("");

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

  const additionalPillContainerStyle =
    pillsSet.size <= 0 ? { padding: "0" } : {};

  return (
    <div className="components-PillsSelect">
      <div className="pills-container" style={additionalPillContainerStyle}>
        {Array.from(pillsSet).map((item, idx) => (
          <div key={idx} className="pill">
            <div className="pill-data" onWheel={(e) => handleDataScroll(e)}>
              {item.toString()}
            </div>

            <div className="clearpill-container clearbtn-container">
              <CrossButton onClick={() => handleItemRemove(item)} />
            </div>
          </div>
        ))}
      </div>

      <div className="editing-container">
        <input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          tabIndex={0}
          type="text"
          placeholder="Enter value"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e)}
          style={{ border: "none" }}
        />

        <div className="clearall-container clearbtn-container">
          <CrossButton onClick={handleClearAll} />
        </div>
      </div>
    </div>
  );
}
