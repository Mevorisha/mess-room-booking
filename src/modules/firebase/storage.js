import { fbStorageGetRef } from "./init";
import { getDownloadURL, uploadBytesResumable } from "firebase/storage";
import ErrorMessages from "../errors/ErrorMessages";

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
          reject(ErrorMessages.FILE_UPLOAD_FAILED);
        }
      } else {
        reject(ErrorMessages.FILE_UPLOAD_FAILED);
      }
    });
  });
}

/**
 * Upload a file to Firebase Storage
 * @param {import("./init.js").StoragePaths} path - Path in the storage bucket to upload the file
 * @param {string} filename - Name of the file
 * @param {File} file - File to upload
 * @returns {Promise<string>} - URL of the uploaded file
 */
async function fbStorageUpload(path, filename, file) {
  try {
    const storageRef = fbStorageGetRef(path, filename);
    const snapshot = await uploadBytesResumable(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return Promise.resolve(downloadURL);
  } catch (error) {
    console.error(error.toString());
    return Promise.reject(ErrorMessages.FILE_UPLOAD_FAILED);
  }
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
    console.error(error.toString());
    return Promise.reject(ErrorMessages.FILE_DOWNLOAD_FAILED);
  }
}

export { loadFileFromFilePicker, fbStorageUpload, fbStorageDownload };
