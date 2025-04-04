import { sizehuman } from "./dataConversion.js";
import { lang } from "./language.js";

/**
 * Load a file from a file input element
 * @param {string} accept - File types to accept, e.g. "image/*"
 * @param {number} size - Maximum file size in bytes
 * @returns {Promise<File>} - File object
 * @throws {Error} - If file is not selected
 */
export function loadFileFromFilePicker(accept, size) {
  const fileInput =
    /** @type {HTMLInputElement} */ (document.getElementById("default-file-input")) ??
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

  const result = new Promise((resolve, reject) => {
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size <= size) {
          resolve(file);
        } else {
          reject(
            lang(
              `File exceeds size limit of ${sizehuman(size)}`,
              `ফাইলের আকার সীমা ${sizehuman(size)} এর চেয়ে বেশি।`,
              `फ़ाइल का आकार सीमा ${sizehuman(size)} से अधिक है।`
            )
          );
        }
      } else {
        reject(lang("No file selected", "কোনও ফাইল নির্বাচন করা হয়নি", "कोई फ़ाइल चयनित नहीं किया गया है"));
      }
    });
  });

  // remove the fileInput
  fileInput.remove();

  return result;
}
