import { lang } from "@/modules/util/language.js";

/* -------------------------------------- TYPEDEFS ----------------------------------- */

export type FnNotifier = (message: string, kind: "info" | "success" | "warning" | "error") => void;

/* ---------------------------------- UTILS ----------------------------------- */
/**
 * Notify the user of the progress of uploading the images.
 * The progress is calculated as the average of the progress of each image.
 * @param {number} smallPercent - Progress of the small image
 * @param {number} mediumPercent - Progress of the medium image
 * @param {number} largePercent - Progress of the large image
 * @param {FnNotifier} notify
 * @param {string} [msg="Uploading"]
 */
export function notifyProgress(
  smallPercent: number,
  mediumPercent: number,
  largePercent: number,
  notify: FnNotifier,
  msg: string = lang("Uploading", "আপলোড হচ্ছে", "अपलोड हो रहा है")
): void {
  const combinedPercent = (smallPercent + mediumPercent + largePercent) / 3;
  // prettier-ignore
  notify(`${msg}: ${combinedPercent.toFixed(2)}% ${lang("complete", "সম্পূর্ণ", "सम्पूर्ण")}`, "info");
}
