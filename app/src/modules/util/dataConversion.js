import { lang } from "./language.js";

/**
 * Converts bytes to human readable format
 * @param {number} bytes
 * @returns {string}
 */
export function sizehuman(bytes) {
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }
  const units = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + " " + units[u];
}

/**
 * Resizes an image blob
 * @param {File} file
 * @param {{ w?: number, h?: number }} target
 * @param {string} mimeType
 * @param {number | undefined} quality
 * @returns {Promise<File>}
 * @throws {Error}
 */
export function resizeImage(file, { w: targetWidth, h: targetHeight }, mimeType = "image/jpeg", quality = undefined) {
  return new Promise((resolve, reject) => {
    const filename = file.name;
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      // Clean up URL object
      URL.revokeObjectURL(url);

      // Get image aspect ratio
      const aspectRatio = img.width / img.height;
      let resultWidth = 0;
      let resultHeight = 0;

      // neither width nor height is specified, keep original size
      if (!targetWidth && !targetHeight) {
        resultWidth = img.width;
        resultHeight = img.height;
      }

      // if width is not specified, but height is, calculate width based on aspect ratio
      else if (!targetWidth && targetHeight) {
        resultWidth = Math.floor(targetHeight * aspectRatio);
        resultHeight = targetHeight;
      }

      // if height is not specified, but width is, calculate height based on aspect ratio
      else if (targetWidth && !targetHeight) {
        resultWidth = targetWidth;
        resultHeight = Math.floor(targetWidth / aspectRatio);
      }

      // if both width and height are specified, use it
      else if (targetWidth && targetHeight) {
        resultWidth = targetWidth;
        resultHeight = targetHeight;
      }

      // Create a canvas and resize the image
      const canvas = document.createElement("canvas");
      canvas.width = resultWidth;
      canvas.height = resultHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(
          new Error(lang("Canvas creation failed", "ক্যানভাস তৈরি করা ব্যর্থ হয়েছে", "कैनवास निर्माण विफल हो गया"))
        );
        return;
      }

      // Draw the image with the specified width and height
      ctx.drawImage(img, 0, 0, resultWidth, resultHeight);

      // Convert the canvas back to a File
      canvas.toBlob(
        (resizedBlob) => {
          if (resizedBlob) resolve(new File([resizedBlob], filename, { type: mimeType }));
          else
            reject(
              new Error(
                lang("Canvas conversion failed", "ক্যানভাস কনভার্সন ব্যর্থ হয়েছে", "कैनवास रूपांतरण विफल हो गया")
              )
            );
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => {
      // Clean up URL object
      URL.revokeObjectURL(url);
      reject(err);
    };

    // Start loading the image
    img.src = url;
  });
}

/**
 * @typedef {Object} Base64FileData
 * @property {string} type
 * @property {string} name
 * @property {string} base64
 */

/**
 * @param {File} file
 * @returns {Promise<Base64FileData>}
 */
export function fileToBase64FileData(file) {
  /**
   * @param {ProgressEvent<FileReader>} e
   * @param {FileReader} reader
   * @param {string} fileType
   * @param {string} fileName
   * @param {(value: Base64FileData | PromiseLike<Base64FileData>) => void} resolve
   * @param {(reason?: any) => void} reject
   */
  function onloaded(e, reader, fileType, fileName, resolve, reject) {
    const readerData = reader.result;
    if (!readerData) {
      reject(new Error(lang("File data is null", "ফাইলের ডেটা নাল", "फ़ाइल डेटा नल है")));
      return;
    }

    if (typeof readerData === "string") {
      const base64string = readerData.split(",")[1];
      resolve({
        type: fileType,
        name: fileName,
        base64: base64string,
      });
      return;
    }

    const base64string = new Uint8Array(readerData).reduce((data, byte) => data + String.fromCharCode(byte), "");

    resolve({
      type: fileType,
      name: fileName,
      base64: btoa(base64string),
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => onloaded(e, reader, file.type, file.name, resolve, reject);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * @param {Base64FileData} fileData
 * @returns {File}
 */
export function base64FileDataToFile(fileData) {
  const byteStr = atob(fileData.base64);
  const u8arr = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) {
    fileData[i] = byteStr.charCodeAt(i);
  }
  return new File([u8arr], fileData.name, { type: fileData.type });
}
