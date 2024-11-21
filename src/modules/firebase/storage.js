import { fbStorageGetRef } from "./init";
import {
  deleteObject,
  getBytes,
  getDownloadURL,
  uploadBytes,
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
 * @param {string} path - Path in the storage bucket to upload the file
 * @param {File} file - File to upload
 * @returns {FbStorageTransferTask} - URL of the uploaded file
 *
 * Note: awaiting on UploadTask converts it into a UploadTaskSnapshot which is
 *       resolved when the upload is completed. For this reason, UploadTask MUST
 *       NOT be wrapped in a Promise.
 */
function fbStorageUpload(path, file) {
  const storageRef = fbStorageGetRef(path);
  return FbStorageTransferTask.wrap(
    uploadBytesResumable(storageRef, file, { contentType: file.type })
  );
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
 * @param {string} path - Path in the storage bucket to replace the file
 * @param {File} file - File to replace
 * @returns {FbStorageTransferTask} - Firebase upload task
 *
 * Note: awaiting on UploadTask converts it into a UploadTaskSnapshot which is
 *       resolved when the upload is completed. For this reason, UploadTask MUST
 *       NOT be wrapped in a Promise.
 */
function fbStorageUpdate(path, file) {
  const storageRef = fbStorageGetRef(path);
  return FbStorageTransferTask.wrap(
    uploadBytesResumable(storageRef, file, { contentType: file.type })
  );
}

/**
 * Move a file in Firebase Storage
 * @param {string} path1 - Path in the storage bucket to move the file
 * @param {string} path2 - Path in the storage bucket to move the file to
 * @param {boolean} del - Delete the original file
 * @returns {Promise<string>} - URL of the moved file
 */
async function fbStorageMove(path1, path2, del = true) {
  try {
    const storageRef1 = fbStorageGetRef(path1);
    const storageRef2 = fbStorageGetRef(path2);
    // download the file from storageRef1 and upload it to storageRef2
    const snapshot = await uploadBytes(
      storageRef2,
      await getBytes(storageRef1)
    );
    const downloadURL = await getDownloadURL(snapshot.ref);
    // delete the file from storageRef1
    if (del) await deleteObject(storageRef1);
    return Promise.resolve(downloadURL);
  } catch (error) {
    const errmsg = getCleanFirebaseErrMsg(error);
    console.error(error.toString());
    return Promise.reject(errmsg);
  }
}

/**
 * Copy a file in Firebase Storage
 * @param {string} path1 - Path in the storage bucket to copy the file
 * @param {string} path2 - Path in the storage bucket to copy the file to
 * @returns {Promise<string>} - URL of the copied file
 */
async function fbStorageCopy(path1, path2) {
  return fbStorageMove(path1, path2, false);
}

/**
 * Delete a file from Firebase Storage
 * @param {string} path - Path in the storage bucket to delete the file
 * @returns {Promise<void>}
 */
async function fbStorageDelete(path) {
  try {
    const storageRef = fbStorageGetRef(path);
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
  loadFileFromFilePicker,
  fbStorageUpload,
  fbStorageDownload,
  fbStorageUpdate,
  fbStorageMove,
  fbStorageCopy,
  fbStorageDelete,
};
