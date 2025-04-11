import { FirebaseAuth } from "../firebase/init.js";
import { CachePaths } from "./caching.js";
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
 * @param {number} [quality]
 * @returns {Promise<File>}
 * @throws {Error}
 */
export async function resizeImage(
  file,
  { w: targetWidth, h: targetHeight },
  mimeType = "image/jpeg",
  quality = void 0
) {
  const imgDataUrl = await fileToDataUrl(file);

  return new Promise((resolve, reject) => {
    const filename = file.name;
    const img = new Image();

    img.onload = () => {
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

    img.onerror = (err) => reject(err);

    // Start loading the image
    img.src = imgDataUrl;
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
    u8arr[i] = byteStr.charCodeAt(i);
  }
  return new File([u8arr], fileData.name, { type: fileData.type });
}

/**
 * @param {Base64FileData} fileData
 * @returns {string}
 */
export function base64FileDataToDataUrl(fileData) {
  return `data:${fileData.type};base64,${fileData.base64}`;
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function fileToDataUrl(file) {
  const b64data = await fileToBase64FileData(file);
  return base64FileDataToDataUrl(b64data);
}

const FILE_LOADER_CACHE_PATH = CachePaths.FILE_LOADER;

/**
 * @param {string} url
 * @param {boolean} [requireAuth]
 * @returns {Promise<string>}
 */
export async function fetchAsDataUrl(url, requireAuth = false) {
  // keep blob and data urls as is
  // will add more if needed
  // we only want network urls to be fetched and cached
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  const cache = await caches.open(FILE_LOADER_CACHE_PATH);
  const cachedRes = await cache.match(url);
  if (cachedRes) {
    const result = await cachedRes.text();
    // console.warn("ImageLoader: found", url, ": size:", result.length);
    return result;
  }

  const headers = /** @type {Record<String, string>} */ ({});
  if (requireAuth) {
    headers["X-Firebase-Token"] = (await FirebaseAuth.currentUser?.getIdToken()) ?? "";
  }

  // Fetch the image from the URL
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      lang(
        `HTTP error! status: ${response.status}`,
        `এইচ-টি-টি-পি সমস্যা! স্ট্যাটাস: ${response.status}`,
        `एच-टी-टी-पी समस्या! स्टेटस: ${response.status}`
      )
    );
  }

  // Convert the image to a Blob
  const blob = await response.blob();
  // convert blob to a file
  const file = new File([blob], "unknown.bin", { type: blob.type });
  // get the data url of the file
  const result = await fileToDataUrl(file);
  // cache the result
  await cache.put(url, new Response(result, { status: 200 }));

  return result;
}
