import { fbStorageGetRef } from "./init";
import {
  deleteObject,
  getBlob,
  getBytes,
  getDownloadURL,
  getMetadata,
  uploadBytesResumable,
} from "firebase/storage";
import { getCleanFirebaseErrMsg } from "../errors/ErrorMessages";
import { sizehuman } from "../util/dataConversion.js";

class FbStorageTransferTask {
  /**
   * @private
   * @type {import("firebase/storage").UploadTask}
   */
  uploadTask;

  /**
   * @public
   * @type {((percent: number) => void) | undefined}  - Progress callback
   */
  onProgress;

  /**
   * @public
   * @type {(() => void) | undefined} - When the upload is running
   */
  onRunning;

  /**
   * @public
   * @type {(() => void) | undefined} - When the upload is paused
   */
  onPaused;

  /**
   * @public
   * @type {(() => void) | undefined} - When the upload is cancelled
   */
  onCancelled;

  /**
   * @public
   * @type {(() => void) | undefined} - When the upload is sucessful
   */
  onSuccess;

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
   * Monitor the progress of a file upload on basis of certain functions.
   * You must set the following functions before calling this functions:
   * - this.onProgress
   * - this.onRunning
   * - this.onPaused
   * - this.onCancelled
   * - this.onSuccess
   *
   * @returns {FbStorageTransferTask} - Firebase upload task
   * @throws {Error} - Firebase error on error during upload
   *
   * Note: awaiting on UploadTask converts it into a UploadTaskSnapshot which is
   *       resolved when the upload is completed. For this reason, UploadTask MUST
   *       NOT be wrapped in a Promise.
   */
  monitor() {
    this.uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        this.onProgress && this.onProgress(progress);
        switch (snapshot.state) {
          case "running":
            this.onRunning && this.onRunning();
            break;
          case "paused":
            this.onPaused && this.onPaused();
            break;
          case "canceled":
            this.onCancelled && this.onCancelled();
            break;
          case "success":
            this.onSuccess && this.onSuccess();
            break;
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
  async getDownloadURL() {
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
 * Returns a File given a firebase storage path
 * @param {string} path - Path in the storage bucket to upload the file
 * @returns {Promise<File>} - File in strorage
 */
async function fbStorageDownloadFromPath(path) {
  try {
    const storageRef = fbStorageGetRef(path);
    const metadata = await getMetadata(storageRef);
    // get mimetype or use a default mimetype for bin data
    const mimeType = metadata.contentType || "application/octet-stream";
    // download the file as Blob
    const blob = await getBlob(storageRef);
    // if no name, set as untitled.bin
    const fileName = path.split("/").pop() || "untitled.bin";
    // convert Blob to File
    const file = new File([blob], fileName, { type: mimeType });
    return Promise.resolve(file);
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
 * Copy a file in Firebase Storage
 * @param {string} path1 - Path in the storage bucket to copy the file
 * @param {string} path2 - Path in the storage bucket to copy the file to
 * @returns {Promise<FbStorageTransferTask>} - URL of the copied file
 */
async function fbStorageCopy(path1, path2) {
  const storageRef1 = fbStorageGetRef(path1);
  const storageRef2 = fbStorageGetRef(path2);
  // download the file from storageRef1 and upload it to storageRef2
  return FbStorageTransferTask.wrap(
    uploadBytesResumable(storageRef2, await getBytes(storageRef1))
  );
}

/**
 * Move a file in Firebase Storage
 * @param {string} path1 - Path in the storage bucket to move the file
 * @param {string} path2 - Path in the storage bucket to move the file to
 * @returns {Promise<FbStorageTransferTask>} - URL of the moved file
 */
async function fbStorageMove(path1, path2) {
  try {
    const storageRef1 = fbStorageGetRef(path1);
    const task = await fbStorageCopy(path1, path2);

    // on upload complete, delete the original file
    task.onSuccess = async () => await deleteObject(storageRef1);
    task.monitor();

    return Promise.resolve(task);
  } catch (error) {
    const errmsg = getCleanFirebaseErrMsg(error);
    console.error(error.toString());
    return Promise.reject(errmsg);
  }
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
  fbStorageDownloadFromPath,
  fbStorageUpdate,
  fbStorageCopy,
  fbStorageMove,
  fbStorageDelete,
};
