import { fbRtdbRead, fbRtdbUpdate } from "../../modules/firebase/db.js";
import { RtDbPaths, StoragePaths } from "../../modules/firebase/init.js";
import {
  fbStorageMove,
  fbStorageUpload,
} from "../../modules/firebase/storage.js";
import { resizeImage } from "../../modules/util/dataConversion.js";
import { UploadedImage } from "../user.js";
import { lang } from "../../modules/util/language.js";

/* -------------------------------------- TYPEDEFS ----------------------------------- */

/**
 * @typedef {(message: string, kind: "info" | "success" | "warning" | "error") => void} FnNotifier
 */

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
  smallPercent,
  mediumPercent,
  largePercent,
  notify,
  msg = lang("Uploading", "আপলোড হচ্ছে", "अपलोड हो रहा है")
) {
  const combinedPercent = (smallPercent + mediumPercent + largePercent) / 3;
  // prettier-ignore
  notify(`${msg}: ${combinedPercent.toFixed(2)}% ${lang("complete", "সম্পূর্ণ", "सम्पूर्ण")}`, "info");
}

/**
 * Creates 3 sizes of the given image and uploads them to Firebase Storage.
 * @param {string} uid
 * @param {"PUBLIC" | number} visibilityCode
 * @param {string} smallpath
 * @param {string} mediumpath
 * @param {string} largepath
 * @param {File} image
 * @param {FnNotifier} notify
 * @returns {Promise<UploadedImage>}
 */
export async function uploadThreeSizesFromOneImage(
  uid,
  visibilityCode,
  smallpath,
  mediumpath,
  largepath,
  image,
  notify
) {
  /* --------------------- SMALL PHOTO --------------------- */
  const smallimg = await resizeImage(
    image,
    { w: UploadedImage.Sizes.SMALL },
    image.type
  );
  const smallTask = fbStorageUpload(smallpath, smallimg);
  smallTask.onProgress = (percent) => notifyProgress(percent, 0, 0, notify);

  /* --------------------- MEDIUM PHOTO --------------------- */
  const mediumimg = await resizeImage(
    image,
    { w: UploadedImage.Sizes.MEDIUM },
    image.type
  );
  const mediumTask = fbStorageUpload(mediumpath, mediumimg);
  mediumTask.onProgress = (percent) => notifyProgress(100, percent, 0, notify);

  /* --------------------- LARGE PHOTO --------------------- */
  const largeimg = await resizeImage(
    image,
    { w: UploadedImage.Sizes.LARGE },
    image.type
  );
  const largeTask = fbStorageUpload(largepath, largeimg);
  largeTask.onProgress = (percent) => notifyProgress(100, 100, percent, notify);

  // perform the upload
  const small = await smallTask.monitor().getDownloadURL();
  const medium = await mediumTask.monitor().getDownloadURL();
  const large = await largeTask.monitor().getDownloadURL();
  return new UploadedImage(uid, small, medium, large, visibilityCode);
}

/**
 * Updates the visibility of a user's identity document.
 * @param {string} userId - The unique identifier of the user.
 * @param {"work" | "gov"} idKey - The unique key associated with the identity document.
 * @param {"WORK_ID" | "GOV_ID"} idType - The type of identity document (work or government ID).
 * @param {"PRIVATE" | "PUBLIC"} visibility - Target visibility.
 * @param {FnNotifier} notify - A callback function to notify the user about the status of the operation.
 * @returns {Promise<UploadedImage | null>} - A promise that resolves when the operation is complete.
 */
export async function updateIdenityPhotosVisibilityGenreic(
  userId,
  idKey,
  idType,
  visibility,
  notify
) {
  const oldVisibilityCode =
    /** @type {string} */
    (
      await fbRtdbRead(
        RtDbPaths.Identity(userId) + `/identityPhotos/${idKey}Id/visibilityCode`
      )
    ) || undefined;

  if (!oldVisibilityCode) {
    return Promise.reject(
      lang(
        `Cannot change visibility: ${idKey} identity not found`,
        `দৃশ্যমানতা পরিবর্তন করা যাবে না: ${idKey} পরিচয় পাওয়া যায়নি`,
        `दृश्यता बदल नहीं सकता: ${idKey} पहचान नहीं मिली`
      )
    );
  }

  const targetVisibilityCode = visibility === "PRIVATE" ? Date.now() : "PUBLIC";

  // if old and new codes are same, no need to move, return as is
  if (oldVisibilityCode === "" + targetVisibilityCode) {
    return null;
  }

  // prettier-ignore
  notifyProgress(0, 0, 0, notify, lang("Preparing to move", "স্থানান্তরের জন্য প্রস্তুতি নেওয়া হচ্ছে", "स्थानांतरित करने के लिए तैयारी हो रही है"));

  const smallTaskPromise = fbStorageMove(
    StoragePaths.IdentityDocuments(userId, oldVisibilityCode, idType, UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL), // prettier-ignore
    StoragePaths.IdentityDocuments(userId, targetVisibilityCode, idType, UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL) // prettier-ignore
  );
  const medTaskPromise = fbStorageMove(
    StoragePaths.IdentityDocuments(userId, oldVisibilityCode, idType, UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM), // prettier-ignore
    StoragePaths.IdentityDocuments(userId, targetVisibilityCode, idType, UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM) // prettier-ignore
  );
  const largeTaskPromise = fbStorageMove(
    StoragePaths.IdentityDocuments(userId, oldVisibilityCode, idType, UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE), // prettier-ignore
    StoragePaths.IdentityDocuments(userId, targetVisibilityCode, idType, UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE) // prettier-ignore
  );

  /**
   * @param {import("../../modules/firebase/storage.js").FbStorageTransferTask} task
   * @param {number} a
   * @param {number} b
   * @param {number} c
   * @returns {import("../../modules/firebase/storage.js").FbStorageTransferTask}
   */
  function notifyProgressAndPassTransfTask(task, a, b, c) {
    // prettier-ignore
    notifyProgress(a, b, c, notify, lang("Preparing to move", "স্থানান্তরের জন্য প্রস্তুতি নেওয়া হচ্ছে", "स्थानांतरित करने के लिए तैयारी हो रही है"));
    return task;
  }

  const [smallTask, medTask, largeTask] = await Promise.all([
    smallTaskPromise.then((t) => notifyProgressAndPassTransfTask(t, 100, 0, 0)),
    medTaskPromise.then((t) => notifyProgressAndPassTransfTask(t, 100, 100, 0)),
    largeTaskPromise.then((t) =>
      notifyProgressAndPassTransfTask(t, 100, 100, 100)
    ),
  ]);

  smallTask.onProgress = (percent) => notifyProgress(percent, 0, 0, notify);
  medTask.onProgress = (percent) => notifyProgress(100, percent, 0, notify);
  largeTask.onProgress = (percent) => notifyProgress(100, 100, percent, notify);

  // perform the move
  const small = await smallTask.monitor().getDownloadURL();
  const medium = await medTask.monitor().getDownloadURL();
  const large = await largeTask.monitor().getDownloadURL();

  // update RtDb
  await fbRtdbUpdate(RtDbPaths.Identity(userId) + "/identityPhotos", {
    [`${idKey}Id`]: {
      small,
      medium,
      large,
      visibilityCode: targetVisibilityCode,
    },
  });

  // return url and visibility code
  return Promise.resolve(
    new UploadedImage(userId, small, medium, large, targetVisibilityCode)
  );
}
