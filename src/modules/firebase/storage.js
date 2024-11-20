import { fbStorageGetRef } from "./init";
import {
  deleteObject,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import { getCleanFirebaseErrMsg } from "../errors/ErrorMessages";
import { sizehuman } from "../util/dataConversion.js";

class FbStorageTransferTask {
  /**
   * @param {import("firebase/storage").UploadTask} uploadTask
   */
  constructor(uploadTask) {
    this.uploadTask = uploadTask;
  }

  /**
   * @static
   * @param {import("firebase/storage").UploadTask} uploadTask
   * @returns {FbStorageTransferTask}
   */
  static wrap(uploadTask) {
    return new FbStorageTransferTask(uploadTask);
  }

  /**
   * Monitor the progress of a file upload
   * @param {(percent: number) => void} onProgress - Progress callback
   * @param {(() => void) | undefined} onRunning - When the upload is running
   * @param {(() => void) | undefined} onPaused - When the upload is paused
   * @param {(() => void) | undefined} onCancelled - When the upload is cancelled
   * @returns {FbStorageTransferTask} - Firebase upload task
   * @throws {Error} - Firebase error on error during upload
   *
   * Note: awaiting on UploadTask converts it into a UploadTaskSnapshot which is
   *       resolved when the upload is completed. For this reason, UploadTask MUST
   *       NOT be wrapped in a Promise.
   */
  fbStorageMonitorUpload(
    onProgress,
    onRunning = undefined,
    onPaused = undefined,
    onCancelled = undefined
  ) {
    this.uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
        switch (snapshot.state) {
          case "running":
            onRunning && onRunning();
            break;
          case "paused":
            onPaused && onPaused();
            break;
          case "canceled":
            onCancelled && onCancelled();
            break;
          case "success":
          case "error":
          default:
            break;
        }
      },
      (error) => {
        throw error;
      }
    );

    return FbStorageTransferTask.wrap(this.uploadTask);
  }

  /**
   * Get the URL of a file in Firebase Storage
   * @returns {Promise<string>} - URL of the file
   */
  async fbStorageGetURL() {
    try {
      const snapshot = await this.uploadTask;
      const downloadURL = await getDownloadURL(snapshot.ref);
      return Promise.resolve(downloadURL);
    } catch (error) {
      const errmsg = getCleanFirebaseErrMsg(error);
      console.error(error.toString());
      return Promise.reject(errmsg);
    }
  }
}

/**
 * Load a file from a file input element
 * @param {string} accept - File types to accept, e.g. "image/*"
 * @param {number} size - Maximum file size in bytes
 * @returns {Promise<File>} - File object
 * @throws {Error} - If file is not selected
 */
function loadFileFromFilePicker(accept, size) {
  const fileInput =
    /** @type {HTMLInputElement} */ (
      document.getElementById("default-file-input")
    ) ??
    /* if the input element is not found, create a new one */
    (function () {
      const newFileInput = document.createElement("input");
      newFileInput.id = "default-file-input";
      newFileInput.type = "file";
      newFileInput.style.display = "none";
      document.body.appendChild(newFileInput);
      return newFileInput;
    })();

  fileInput.accept = accept;
  fileInput.click();

  return new Promise((resolve, reject) => {
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size <= size) {
          resolve(file);
        } else {
          reject(`File exceeds size limit of ${sizehuman(size)}`);
        }
      } else {
        reject("No file selected");
      }
    });
  });
}

/**
 * Upload a file to Firebase Storage
 * @param {import("./init.js").StoragePaths} path - Path in the storage bucket to upload the file
 * @param {string} filename - Name of the file
 * @param {File} file - File to upload
 * @returns {FbStorageTransferTask} - URL of the uploaded file
 *
 * Note: awaiting on UploadTask converts it into a UploadTaskSnapshot which is
 *       resolved when the upload is completed. For this reason, UploadTask MUST
 *       NOT be wrapped in a Promise.
 */
function fbStorageUpload(path, filename, file) {
  const storageRef = fbStorageGetRef(path, filename);
  return FbStorageTransferTask.wrap(
    uploadBytesResumable(storageRef, file, { contentType: file.type })
  );
}

/**
 * Modify the path of a file in Firebase Storage
 * @param {string} filename - Name of the file
 * @param {...string} modifiers - Modifiers to add to the path
 * @returns {string} - Modified path
 */
function fbStorageModFilename(filename, ...modifiers) {
  return [filename, ...modifiers].join("/");
}

/**
 * Modify the URL of a file in Firebase Storage with parameters
 * @param {string} url - URL of the file to modify
 * @param {{ maxWidth?: number, maxHeight?: number }} params - Parameters to modify the URL with
 * @returns {string} - Modified URL
 */
function fbStorageModURL(url, { maxWidth, maxHeight }) {
  if (!url) return "";
  const modURL = new URL(url);
  if (maxWidth) modURL.searchParams.set("w", maxWidth.toString());
  if (maxHeight) modURL.searchParams.set("h", maxHeight.toString());
  return modURL.toString();
}

/**
 * Download a file from Firebase Storage
 * @param {string} url - URL of the file to download
 * @returns {Promise<Blob>} - File blob
 */
async function fbStorageDownload(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return Promise.resolve(blob);
  } catch (error) {
    const errmsg = getCleanFirebaseErrMsg(error);
    console.error(error.toString());
    return Promise.reject(errmsg);
  }
}

/**
 * Replace a file in Firebase Storage
 * @param {import("./init.js").StoragePaths} path - Path in the storage bucket to replace the file
 * @param {string} filename - Name of the file
 * @param {File} file - File to replace
 * @returns {FbStorageTransferTask} - Firebase upload task
 *
 * Note: awaiting on UploadTask converts it into a UploadTaskSnapshot which is
 *       resolved when the upload is completed. For this reason, UploadTask MUST
 *       NOT be wrapped in a Promise.
 */
function fbStorageUpdate(path, filename, file) {
  const storageRef = fbStorageGetRef(path, filename);
  return FbStorageTransferTask.wrap(
    uploadBytesResumable(storageRef, file, { contentType: file.type })
  );
}

/**
 * Delete a file from Firebase Storage
 * @param {import("./init.js").StoragePaths} path - Path in the storage bucket to delete the file
 * @param {string} filename - Name of the file
 * @returns {Promise<void>}
 */
async function fbStorageDelete(path, filename) {
  try {
    const storageRef = fbStorageGetRef(path, filename);
    await deleteObject(storageRef);
    return Promise.resolve();
  } catch (error) {
    const errmsg = getCleanFirebaseErrMsg(error);
    console.error(error.toString());
    return Promise.reject(errmsg);
  }
}

export {
  FbStorageTransferTask as FbStorageUploadTask,
  fbStorageModURL,
  fbStorageModFilename,
  loadFileFromFilePicker,
  fbStorageUpload,
  fbStorageDownload,
  fbStorageUpdate,
  fbStorageDelete,
};
