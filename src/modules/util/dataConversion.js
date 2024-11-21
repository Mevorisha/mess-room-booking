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
export function resizeImage(
  file,
  { w: targetWidth, h: targetHeight },
  mimeType = "image/jpeg",
  quality = undefined
) {
  return new Promise((resolve, reject) => {
    const filename = file.name;
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      // Clean up URL object
      URL.revokeObjectURL(url);

      // Get image aspect ratio
      const aspectRatio = img.width / img.height;
      let resultWidth = 0,
        resultHeight = 0;

      // neither width nor height is specified, keep original size
      if (!targetWidth && !targetHeight) {
        resultWidth = img.width;
        resultHeight = img.height;
      }

      // if width is not specified, but height is, calculate width based on aspect ratio
      else if (!targetWidth && targetHeight) {
        resultWidth = Math.floor(targetHeight * aspectRatio);
      }

      // if height is not specified, but width is, calculate height based on aspect ratio
      else if (targetWidth && !targetHeight) {
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
        reject(new Error("Canvas creation failed"));
        return;
      }

      // Draw the image with the specified width and height
      ctx.drawImage(img, 0, 0, resultWidth, resultHeight);

      // Convert the canvas back to a File
      canvas.toBlob(
        (resizedBlob) => {
          if (resizedBlob)
            resolve(new File([resizedBlob], filename, { type: mimeType }));
          else reject(new Error("Canvas conversion failed"));
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
