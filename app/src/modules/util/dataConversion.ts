import { lang } from "./language.js";

/**
 * Converts bytes to human readable format
 */
export function sizehuman(bytes: number): string {
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

export async function resizeImage(
  file: File,
  { w: targetWidth, h: targetHeight }: { w?: number; h?: number },
  mimeType = "image/jpeg",
  quality?: number
): Promise<File> {
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
      if (targetWidth == null && targetHeight == null) {
        resultWidth = img.width;
        resultHeight = img.height;
      }

      // if width is not specified, but height is, calculate width based on aspect ratio
      else if (targetWidth == null && targetHeight != null) {
        resultWidth = Math.floor(targetHeight * aspectRatio);
        resultHeight = targetHeight;
      }

      // if height is not specified, but width is, calculate height based on aspect ratio
      else if (targetWidth != null && targetHeight == null) {
        resultWidth = targetWidth;
        resultHeight = Math.floor(targetWidth / aspectRatio);
      }

      // if both width and height are specified, use it
      else if (targetWidth != null && targetHeight != null) {
        resultWidth = targetWidth;
        resultHeight = targetHeight;
      }

      // Create a canvas and resize the image
      const canvas = document.createElement("canvas");
      canvas.width = resultWidth;
      canvas.height = resultHeight;

      const ctx = canvas.getContext("2d");

      if (ctx == null) {
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
          if (resizedBlob != null) resolve(new File([resizedBlob], filename, { type: mimeType }));
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

    img.onerror = (error: unknown) => reject(new Error(String(error)));

    // Start loading the image
    img.src = imgDataUrl;
  });
}

export interface Base64FileData {
  type: string;
  name: string;
  base64: string;
}

export function fileToBase64FileData(file: File): Promise<Base64FileData> {
  function onloaded(
    _e: ProgressEvent<FileReader>,
    reader: FileReader,
    fileType: string,
    fileName: string,
    resolve: (value: Base64FileData | PromiseLike<Base64FileData>) => void,
    reject: (reason?: unknown) => void
  ) {
    const readerData = reader.result;
    if (readerData == null) {
      reject(new Error(lang("File data is null", "ফাইলের ডেটা নাল", "फ़ाइल डेटा नल है")));
      return;
    }

    if (typeof readerData === "string") {
      const base64string = readerData.split(",")[1] as string;
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
    reader.onerror = (error: unknown) => reject(new Error(String(error)));
  });
}

export function base64FileDataToFile(fileData: Base64FileData): File {
  const byteStr = atob(fileData.base64);
  const u8arr = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) {
    u8arr[i] = byteStr.charCodeAt(i);
  }
  return new File([u8arr], fileData.name, { type: fileData.type });
}

export function base64FileDataToDataUrl(fileData: Base64FileData): string {
  return `data:${fileData.type};base64,${fileData.base64}`;
}

export async function fileToDataUrl(file: File): Promise<string> {
  const b64data = await fileToBase64FileData(file);
  return base64FileDataToDataUrl(b64data);
}
