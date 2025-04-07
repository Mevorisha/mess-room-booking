import React, { useEffect, useRef, useState } from "react";
import { loadFileFromFilePicker } from "@/modules/util/dom.js";
import { sizehuman } from "@/modules/util/dataConversion";
import { lang } from "@/modules/util/language.js";
import useNotification from "@/hooks/notification";
import useDialogBox from "@/hooks/dialogbox";
import StringySet from "@/modules/util/StringySet";
import ButtonText from "../ButtonText";
import DialogImagePreview from "@/components/DialogImagePreview";

import "./styles.css";

const MAX_SIZE_IN_BYTES = 1 * 1024 * 1024; // 1MB
const MAX_TOTAL_SIZE_IN_BYTES = 6 * MAX_SIZE_IN_BYTES; // 6MB

export class FileRepr {
  /**
   * @param {File | string} fileRepr
   */
  constructor(fileRepr) {
    if (fileRepr instanceof File) {
      this.file = fileRepr;
      this.uri = null;
    }
    if (typeof fileRepr === "string") {
      this.uri = fileRepr;
      this.file = null;
    }
  }

  /**
   * @param {File | string} fileRepr
   * @returns {FileRepr}
   */
  static from(fileRepr) {
    return new FileRepr(fileRepr);
  }

  isUri() {
    return this.uri !== null;
  }

  isFile() {
    return this.file !== null;
  }

  /**
   * @throws {Error} if not a file
   * @returns {File} The file object.
   */
  getFile() {
    if (this.isFile()) {
      return this.file;
    }
    throw new Error("FileRepr is not a File");
  }

  /**
   * @throws {Error} if not a uri
   * @returns {string} The URI string.
   */
  getUri() {
    if (this.isUri()) {
      return this.uri;
    }
    throw new Error("FileRepr is not a URI");
  }

  toString() {
    if (this.isFile()) {
      return `[object File <"${this.file.name}">]`;
    }
    return this.uri;
  }

  /**
   * This method is called when the object is converted to a primitive value.
   * It is used to provide a string representation of the object.
   * Used (for some reason) by StringySet<T> to compare objects.
   * @param {"number" | "string" | "default"} hint
   * @returns {string} The string representation of the object.
   */
  [Symbol.toPrimitive](hint) {
    return this.toString();
  }
}

/**
 * @typedef {object} ImageFilesInputProps
 * @property {string} [placeholder] - The placeholder text for the input field when enabled.
 * @property {boolean} [disabled] - If true, disables the input field and interactions.
 * @property {boolean} [required] - Indicates if the input should initially be required.
 * @property {number} [maxTotalSizeBytes] - The maximum total size of all files in bytes.
 * @property {number} [maxOneFileSizeBytes=MAX_SIZE_IN_BYTES] - The maximum size of a single file in bytes.
 * @property {number} [minRequired=1] - The minimum number of files required for the input to no longer be marked as required.
 * @property {StringySet<FileRepr>} filesSet - A set containing the current files.
 * @property {React.Dispatch<React.SetStateAction<StringySet<FileRepr>>>} setFilesSet - State updater for modifying the files set.
 */

/**
 * @param {ImageFilesInputProps & {
 *   isRequired: boolean;
 *   handleItemAdd: (item: File) => void;
 *   handleItemRemove: (item: FileRepr) => void;
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
      <div className="empty-message">
        {lang("No files added", "কোন ফাইল নেই", "कोई फ़ाइल नहीं है")}
        <br />
        {!disabled &&
          lang(
            `Minimum ${props.minRequired ?? "1"} file(s) required`,
            `ন্যূনতম ${props.minRequired ?? "1"} ফাইল প্রয়োজন`,
            `न्यूनतम ${props.minRequired ?? "1"} फ़ाइलें आवश्यक हैं`
          )}
      </div>

      <input className="hidden-input" type="text" required={props.isRequired} />

      {!disabled && (
        <ButtonText
          rounded="all"
          title={lang("Add File", "ফাইল অ্যাড করুন", "फ़ाइल ऐड करें")}
          kind="secondary"
          disabled={disabled}
          onClick={(e) => handleAdd1stFile(e)}
        />
      )}
    </div>
  );
}

/**
 * @typedef {Object} RenderableImgData
 * @property {() => boolean} isFile
 * @property {() => boolean} isUri
 * @property {string} [type]
 * @property {string} [name]
 * @property {number} [size]
 * @property {string} url
 * @property {FileRepr} fr
 */

/**
 * @param {ImageFilesInputProps & {
 *   isRequired: boolean;
 *   handleItemAdd: (item: File) => void;
 *   handleItemRemove: (item: FileRepr) => void;
 *   handleClearAll: () => void;
 * }} props - The component properties.
 * @returns {React.JSX.Element}
 */
function NotEmptyFilesInput(props) {
  const { filesSet, handleItemAdd, handleItemRemove, handleClearAll, disabled } = props;
  const notify = useNotification();
  const dialog = useDialogBox();

  const [renderableFilesSet, setRenderableFilesSet] = useState(/** @type {RenderableImgData[]} */ ([]));

  /* Optimization that cleans up object urls before reallocating them for the new set */
  useEffect(
    () =>
      setRenderableFilesSet((oldSet) => {
        // cleanup
        oldSet.filter((it) => it.isFile()).forEach((it) => URL.revokeObjectURL(it.url));
        // new alloc of renderable data
        return filesSet.toArray().map((fr) => {
          if (fr.isFile()) {
            const file = fr.getFile();
            const url = URL.createObjectURL(file);
            return {
              isFile: () => true,
              isUri: () => false,
              type: file.type,
              name: file.name,
              size: file.size,
              url,
              fr,
            };
          } else if (fr.isUri()) {
            const url = fr.getUri();
            return {
              isFile: () => false,
              isUri: () => true,
              type: void 0,
              name: void 0,
              size: void 0,
              url,
              fr,
            };
          }
        });
      }),
    [filesSet]
  );

  const refInput = /** @type {React.RefObject<HTMLInputElement>} */ (useRef(null));

  useEffect(() => {
    // Set the input's custom validity msg attribute based on the number of files
    if (!refInput.current) return;
    if (filesSet.size >= props.minRequired) refInput.current.setCustomValidity("");
    else {
      refInput.current.setCustomValidity(
        lang(
          `Minimum ${props.minRequired} file(s) required`,
          `ন্যূনতম ${props.minRequired} ফাইল প্রয়োজন`,
          `न्यूनतम ${props.minRequired} फ़ाइलें आवश्यक हैं`
        )
      );
    }
  }, [filesSet, props.isRequired, props.minRequired]);

  return (
    <div className="not-empty-files-container">
      <div className="files-header">
        <div className="files-count">
          {filesSet.size} {lang("file(s)", "ফাইল", "फ़ाइल")}
        </div>

        <input ref={refInput} required={props.isRequired} className="hidden-input" type="text" />

        <div className="files-actions">
          {!disabled && (
            <div className="add-file-container">
              <button
                className={`btn-add ${disabled ? "disabled" : ""}`}
                title={lang("Add file", "ফাইল অ্যাড করুন", "फ़ाइल ऐड करें")}
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
          )}
          {!disabled && (
            <div
              className="clearall-container clearbtn-container"
              title={lang("Delete", "সব ফাইল ডিলিট করুন", "सभी फ़ाइलें डिलीट करें")}
            >
              <i
                onClick={!disabled ? handleClearAll : undefined}
                className={`btn-clear ${disabled ? "disabled" : ""} fa fa-trash`}
              />
            </div>
          )}
        </div>
      </div>

      <div className="files-grid">
        {renderableFilesSet.map((imgData, idx) => {
          if (imgData.isFile()) {
            return (
              <div key={idx} className="file-item">
                <div className="file-data">
                  {imgData.type.startsWith("image/") ? (
                    <div className="file-preview">
                      <img
                        onClick={() => {
                          dialog.showStacked(
                            dialog.createNewModalId(),
                            <DialogImagePreview largeImageUrl={imgData.url} />,
                            "large"
                          );
                        }}
                        src={imgData.url}
                        alt={imgData.name}
                      />
                    </div>
                  ) : (
                    <div className="no-preview">
                      <span>{lang("No preview available", "কোন প্রিভিউ নেই", "कोई पूर्वावलोकन उपलब्ध नहीं है")}</span>
                    </div>
                  )}
                </div>

                <div className="file-info">
                  <div className="file-name">{imgData.name}</div>
                  <div className="file-size">{sizehuman(imgData.size)}</div>
                </div>

                {!disabled && (
                  <div className="clearfile-container clearbtn-container" title={lang("Delete", "মুছে ফেলুন", "हटाएं")}>
                    <i
                      onClick={!disabled ? () => handleItemRemove(imgData.fr) : undefined}
                      className={`btn-clear ${disabled ? "disabled" : ""} fa fa-close`}
                    />
                  </div>
                )}
              </div>
            );
          } else if (imgData.isUri()) {
            return (
              <div key={idx} className="file-item">
                <div className="file-data">
                  <div className="file-preview">
                    <img
                      onClick={() => {
                        dialog.showStacked(
                          dialog.createNewModalId(),
                          <DialogImagePreview largeImageUrl={imgData.url} />,
                          "large"
                        );
                      }}
                      src={imgData.url}
                      alt={lang("Preview image", "প্রিভিউ ইমেজ", "पूर्वावलोकन छवि")}
                    />
                  </div>
                </div>

                <div className="file-info">
                  <div className="file-name">{imgData.url.split("/").pop() || lang("Image", "ইমেজ", "छवि")}</div>
                </div>

                {!disabled && (
                  <div className="clearfile-container clearbtn-container" title={lang("Delete", "মুছে ফেলুন", "हटाएं")}>
                    <i
                      onClick={!disabled ? () => handleItemRemove(imgData.fr) : undefined}
                      className={`btn-clear ${disabled ? "disabled" : ""} fa fa-close`}
                    />
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

/**
 * @param {ImageFilesInputProps} props - The component properties.
 * @returns {React.JSX.Element} The rendered image files input component.
 */
export default function ImageFilesInput(props) {
  const { required, filesSet, setFilesSet } = props;

  const minRequired = props.minRequired ?? 1;
  const maxTotalSizeBytes = props.maxTotalSizeBytes ?? MAX_TOTAL_SIZE_IN_BYTES;
  const maxOneFileSizeBytes = props.maxOneFileSizeBytes ?? MAX_SIZE_IN_BYTES;

  const notify = useNotification();

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
      if (!item.type.startsWith("image/")) {
        notify(
          lang("Only image files are allowed", "শুধুমাত্র ইমেজ ফাইল অনুমোদিত", "केवल छवि फ़ाइलें अनुमत हैं"),
          "error"
        );
        return oldSet;
      }
      if (item.size > maxOneFileSizeBytes) {
        notify(
          lang(
            `FIle exceeds limit ${sizehuman(maxOneFileSizeBytes)}`,
            `ফাইলের সীমা ${sizehuman(maxOneFileSizeBytes)} অতিক্রম করেছে`,
            `फ़ाइल सीमा ${sizehuman(maxOneFileSizeBytes)} से अधिक है`
          ),
          "error"
        );
        return oldSet;
      }
      // This only controls upload size, not total size in backend
      const sizeTillNow = Array.from(oldSet).reduce((acc, file) => (file.isFile() ? acc + file.getFile().size : 0), 0);
      if (item.size + sizeTillNow > maxTotalSizeBytes) {
        notify(
          lang(
            `Total size exceeds limit ${sizehuman(maxTotalSizeBytes)}`,
            `মোট আকার সীমা ${sizehuman(maxTotalSizeBytes)} অতিক্রম করেছে`,
            `कुल आकार सीमा ${sizehuman(maxTotalSizeBytes)} से अधिक है`
          ),
          "error"
        );
        return oldSet;
      }
      const newSet = new StringySet(oldSet);
      newSet.add(FileRepr.from(item));
      return newSet;
    });
  }

  /**
   * @param {FileRepr} fileRepr
   */
  function handleItemRemove(fileRepr) {
    setFilesSet((oldSet) => {
      const newSet = new StringySet(oldSet);
      newSet.delete(fileRepr);
      return newSet;
    });
  }

  function handleClearAll() {
    setFilesSet((oldSet) => {
      const newSet = new StringySet(oldSet);
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
          minRequired={minRequired}
          maxTotalSizeBytes={maxTotalSizeBytes}
          maxOneFileSizeBytes={maxOneFileSizeBytes}
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
          minRequired={minRequired}
          maxTotalSizeBytes={maxTotalSizeBytes}
          maxOneFileSizeBytes={maxOneFileSizeBytes}
          isRequired={isRequired}
          handleItemAdd={handleItemAdd}
          handleItemRemove={handleItemRemove}
          handleClearAll={handleClearAll}
        />
      )}
    </div>
  );
}
