import React from "react";
import { loadFileFromFilePicker } from "@/modules/util/dom.js";
import useNotification from "@/hooks/notification";
import ButtonText from "../ButtonText";

import "./styles.css";

const MAX_SIZE_IN_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * @typedef {object} ImageFilesInputProps
 * @property {string} [placeholder] - The placeholder text for the input field when enabled.
 * @property {boolean} [disabled] - If true, disables the input field and interactions.
 * @property {boolean} [required] - Indicates if the input should initially be required.
 * @property {number} [minRequired=1] - The minimum number of files required for the input to no longer be marked as required.
 * @property {Set<File>} filesSet - A set containing the current files.
 * @property {React.Dispatch<React.SetStateAction<Set<File>>>} setFilesSet - State updater for modifying the files set.
 */

/**
 * @param {ImageFilesInputProps & {
 *   isRequired: boolean;
 *   handleItemAdd: (item: File) => void;
 *   handleItemRemove: (item: File) => void;
 *   handleClearAll: () => void;
 * }} props - The component properties.
 * @returns {React.JSX.Element}
 */
function EmptyFilesInput(props) {
  const { disabled, handleItemAdd } = props;
  const notify = useNotification();

  function handleAdd1stFile(e) {
    e.preventDefault();
    // This function will be implemented by you
    loadFileFromFilePicker("image/*", MAX_SIZE_IN_BYTES)
      .then((file) => handleItemAdd(file))
      .catch((e) => notify(e, "error"));
  }

  return (
    <div className="empty-files-container">
      <div className="empty-message">No files added</div>
      <ButtonText
        rounded="all"
        title="Add File"
        kind="secondary"
        disabled={disabled}
        onClick={(e) => handleAdd1stFile(e)}
      />
    </div>
  );
}

/**
 * @param {ImageFilesInputProps & {
 *   isRequired: boolean;
 *   handleItemAdd: (item: File) => void;
 *   handleItemRemove: (item: File) => void;
 *   handleClearAll: () => void;
 * }} props - The component properties.
 * @returns {React.JSX.Element}
 */
function NotEmptyFilesInput(props) {
  const { filesSet, handleItemAdd, handleItemRemove, handleClearAll, disabled } = props;
  const notify = useNotification();

  function handleDataScroll(e) {
    e.target.scrollBy({ left: e.deltaY / 4, behavior: "smooth" });
  }

  return (
    <div className="not-empty-files-container">
      <div className="files-header">
        <div className="files-count">
          {filesSet.size} file{filesSet.size !== 1 ? "s" : ""}
        </div>
        <div className="files-actions">
          <div className="add-file-container">
            <button
              className={`btn-add ${disabled ? "disabled" : ""}`}
              onClick={(e) =>
                !disabled &&
                Promise.resolve(e)
                  .then(() => e.preventDefault())
                  .then(() => loadFileFromFilePicker("image/*", MAX_SIZE_IN_BYTES))
                  .then((file) => handleItemAdd(file))
                  .catch((e) => notify(e, "error"))
              }
              disabled={disabled}
            >
              <i className="fa fa-plus" />
            </button>
          </div>
          <div className="clearall-container clearbtn-container">
            <i
              onClick={!disabled ? handleClearAll : undefined}
              className={`btn-clear ${disabled ? "disabled" : ""} fa fa-close`}
            />
          </div>
        </div>
      </div>

      <div className="files-grid">
        {Array.from(filesSet).map((file, idx) => (
          <div key={idx} className="file-item">
            <div className="file-data" onWheel={(e) => handleDataScroll(e)}>
              <div className="file-name">{file.name}</div>
              <div className="file-size">{(file.size / 1024).toFixed(1)} KB</div>
            </div>

            <div className="clearfile-container clearbtn-container">
              <i
                onClick={!disabled ? () => handleItemRemove(file) : undefined}
                className={`btn-clear ${disabled ? "disabled" : ""} fa fa-close`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * @param {ImageFilesInputProps} props - The component properties.
 * @returns {React.JSX.Element} The rendered image files input component.
 */
export default function ImageFilesInput(props) {
  const { required, minRequired = 1, filesSet, setFilesSet } = props;

  // Use rewuired property of input element
  // If `required` is set, if pillsSet size > 0, set input.reuquired to false
  // Otherwise, keep it as true (same as `required`)
  let isRequired = required;
  if (required && filesSet.size >= minRequired) isRequired = false;

  /**
   * @param {File} item
   */
  function handleItemAdd(item) {
    setFilesSet((oldSet) => {
      const newSet = new Set(oldSet);
      newSet.add(item);
      return newSet;
    });
  }

  /**
   * @param {File} item
   */
  function handleItemRemove(item) {
    setFilesSet((oldSet) => {
      const newSet = new Set(oldSet);
      newSet.delete(item);
      return newSet;
    });
  }

  function handleClearAll() {
    setFilesSet((oldSet) => {
      const newSet = new Set(oldSet);
      newSet.clear();
      return newSet;
    });
  }

  return (
    <div className="components-ImageFilesInput">
      {/** Show UI if no files added */}
      {filesSet.size === 0 && (
        <EmptyFilesInput
          {...props}
          isRequired={isRequired}
          handleItemAdd={handleItemAdd}
          handleItemRemove={handleItemRemove}
          handleClearAll={handleClearAll}
        />
      )}

      {/** Show UI when atleast 1 file added */}
      {filesSet.size > 0 && (
        <NotEmptyFilesInput
          {...props}
          isRequired={isRequired}
          handleItemAdd={handleItemAdd}
          handleItemRemove={handleItemRemove}
          handleClearAll={handleClearAll}
        />
      )}
    </div>
  );
}
