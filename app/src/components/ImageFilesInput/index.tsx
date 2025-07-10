import React, { useEffect, useRef, useState } from "react";
import { loadFileFromFilePicker } from "@/modules/util/dom.js";
import { fileToDataUrl, sizehuman } from "@/modules/util/dataConversion";
import { lang } from "@/modules/util/language.js";
import FileRepr from "@/modules/classes/FileRepr";
import useNotification from "@/hooks/notification";
import useDialog from "@/hooks/dialogbox";
import StringySet from "@/modules/classes/StringySet";
import ButtonText from "@/components/ButtonText";
import DialogImagePreview from "@/components/DialogImagePreview";
import ImageLoader from "@/components/ImageLoader";

import "./styles.css";

const MAX_SIZE_IN_BYTES = 1 * 1024 * 1024; // 1MB
const MAX_TOTAL_SIZE_IN_BYTES = 6 * MAX_SIZE_IN_BYTES; // 6MB

export interface RenderableImgData {
  isFile: () => boolean;
  isUri: () => boolean;
  type?: string;
  name?: string;
  size?: number;
  url: string;
  fr: FileRepr;
}

export interface ImageFilesInputProps {
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxTotalSizeBytes?: number;
  maxOneFileSizeBytes?: number;
  minRequired?: number;
  filesSet: StringySet<FileRepr>;
  setFilesSet: React.Dispatch<React.SetStateAction<StringySet<FileRepr>>>;
}

export interface ImageFilesInputPropsExtended {
  disabled: boolean;
  maxTotalSizeBytes: number;
  maxOneFileSizeBytes: number;
  minRequired: number;
  filesSet: StringySet<FileRepr>;
  setFilesSet: React.Dispatch<React.SetStateAction<StringySet<FileRepr>>>;
  isRequired: boolean;
  handleItemAdd: (item: File) => void;
  handleItemRemove: (item: FileRepr) => void;
  handleClearAll: () => void;
}

function EmptyFilesInput(props: ImageFilesInputPropsExtended): React.ReactNode {
  const { disabled = false, handleItemAdd } = props;
  const notify = useNotification();

  function handleAdd1stFile(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.preventDefault();
    // This function will be implemented by you
    loadFileFromFilePicker("image/*", MAX_SIZE_IN_BYTES)
      .then((file) => handleItemAdd(file))
      .catch((e: Error) => notify(e, "error"));
  }

  return (
    <div className="empty-files-container">
      <div className="empty-message">
        {lang("No files added", "কোন ফাইল নেই", "कोई फ़ाइल नहीं है")}
        <br />
        {!disabled &&
          lang(
            `Minimum ${props.minRequired} file(s) required`,
            `ন্যূনতম ${props.minRequired} ফাইল প্রয়োজন`,
            `न्यूनतम ${props.minRequired} फ़ाइलें आवश्यक हैं`
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

function NotEmptyFilesInput(props: ImageFilesInputPropsExtended): React.ReactNode {
  const { filesSet, handleItemAdd, handleItemRemove, handleClearAll, disabled } = props;
  const notify = useNotification();
  const dialog = useDialog();

  const [fileReprToDataUrl, setFileReprToDataUrl] = useState<Record<string, string>>({});

  /* Optimization that cleans up object urls before reallocating them for the new set */
  useEffect(() => {
    async function getUrls() {
      const entries: [string, string][] = [];
      const urlsDirect = filesSet.filter((fr) => fr.isUri()).toArray();
      for (const fr of urlsDirect) {
        entries.push([fr.toString(), fr.getUri()]);
      }
      const urlsData = filesSet.filter((fr) => fr.isFile()).toArray();
      for (const fr of urlsData) {
        entries.push([fr.toString(), await fileToDataUrl(fr.getFile())]);
      }
      return Object.fromEntries(entries);
    }
    getUrls()
      .then((urls) => setFileReprToDataUrl(urls))
      .catch((e: Error) => notify(e, "error"));
  }, [filesSet, notify]);

  const refInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Set the input's custom validity msg attribute based on the number of files
    if (refInput.current == null) return;
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
                className="btn-add"
                title={lang("Add file", "ফাইল অ্যাড করুন", "फ़ाइल ऐड करें")}
                onClick={(e) => {
                  Promise.resolve(e)
                    .then(() => e.preventDefault())
                    .then(() => loadFileFromFilePicker("image/*", MAX_SIZE_IN_BYTES))
                    .then((file) => handleItemAdd(file))
                    .catch((e: Error) => notify(e, "error"));
                }}
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
              <i onClick={handleClearAll} className="btn-clear fa fa-trash" />
            </div>
          )}
        </div>
      </div>

      <div className="files-grid">
        {filesSet.toArray().map((fileRepr, idx) => {
          if (fileRepr.isFile()) {
            const imgDataUrl = fileReprToDataUrl[String(fileRepr)] ?? "";
            return (
              <div key={idx} className="file-item">
                <div className="file-data">
                  {fileRepr.getFile().type.startsWith("image/") ? (
                    <div className="file-preview">
                      <ImageLoader
                        onClick={() => {
                          dialog.showStacked(
                            dialog.createNewModalId(),
                            <DialogImagePreview largeImageUrl={imgDataUrl} />,
                            "large"
                          );
                        }}
                        src={imgDataUrl}
                        alt={fileRepr.getFile().name}
                      />
                    </div>
                  ) : (
                    <div className="no-preview">
                      <span>{lang("No preview available", "কোন প্রিভিউ নেই", "कोई पूर्वावलोकन उपलब्ध नहीं है")}</span>
                    </div>
                  )}
                </div>

                <div className="file-info">
                  <div className="file-name">{fileRepr.getFile().name}</div>
                  <div className="file-size">{sizehuman(fileRepr.getFile().size)}</div>
                </div>

                {!disabled && (
                  <div className="clearfile-container clearbtn-container" title={lang("Delete", "মুছে ফেলুন", "हटाएं")}>
                    <i onClick={() => handleItemRemove(fileRepr)} className="btn-clear fa fa-close" />
                  </div>
                )}
              </div>
            );
          } else if (fileRepr.isUri()) {
            const imgDirectUrl = fileRepr.getUri();
            const urlWithSizeOriginal = new URL(imgDirectUrl);
            urlWithSizeOriginal.searchParams.set("size", "large");
            return (
              <div key={idx} className="file-item">
                <div className="file-data">
                  <div className="file-preview">
                    <ImageLoader
                      onClick={() => {
                        dialog.showStacked(
                          dialog.createNewModalId(),
                          <DialogImagePreview largeImageUrl={urlWithSizeOriginal.toString()} />,
                          "large"
                        );
                      }}
                      src={imgDirectUrl}
                      alt={lang("Preview image", "প্রিভিউ ইমেজ", "पूर्वावलोकन छवि")}
                    />
                  </div>
                </div>

                {!disabled && (
                  <div className="clearfile-container clearbtn-container" title={lang("Delete", "মুছে ফেলুন", "हटाएं")}>
                    <i onClick={() => handleItemRemove(fileRepr)} className="btn-clear fa fa-close" />
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

export default function ImageFilesInput(props: ImageFilesInputProps): React.ReactNode {
  const { required, filesSet, setFilesSet } = props;

  const minRequired = props.minRequired ?? 1;
  const maxTotalSizeBytes = props.maxTotalSizeBytes ?? MAX_TOTAL_SIZE_IN_BYTES;
  const maxOneFileSizeBytes = props.maxOneFileSizeBytes ?? MAX_SIZE_IN_BYTES;

  const notify = useNotification();

  // Use rewuired property of input element
  // If `required` is set, if pillsSet size > 0, set input.reuquired to false
  // Otherwise, keep it as true (same as `required`)
  let isRequired: boolean = required ?? false;
  if ((required ?? false) && filesSet.size >= minRequired) isRequired = false;

  function handleItemAdd(item: File) {
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

  function handleItemRemove(fileRepr: FileRepr) {
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
          filesSet={filesSet}
          setFilesSet={setFilesSet}
          disabled={props.disabled ?? false}
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
          filesSet={filesSet}
          setFilesSet={setFilesSet}
          disabled={props.disabled ?? false}
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
