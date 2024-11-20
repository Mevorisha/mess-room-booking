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
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {string} mimeType
 * @param {number} quality
 * @returns {Promise<File>}
 * @throws {Error}
 */
export function resizeImageBlob(
  file,
  maxWidth,
  maxHeight,
  mimeType = "image/jpeg",
  quality = 0.8
) {
  return new Promise((resolve, reject) => {
    const filename = file.name;
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url); // Clean up URL object

      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        if (width > height) {
          width = maxWidth;
          height = Math.floor(maxWidth / aspectRatio);
        } else {
          height = maxHeight;
          width = Math.floor(maxHeight * aspectRatio);
        }
      }

      // Create a canvas and resize the image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas creation failed"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Convert the canvas back to a blob
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
