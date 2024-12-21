import { fbRtdbRead, fbRtdbUpdate } from "../../modules/firebase/db.js";
import { RtDbPaths, StoragePaths } from "../../modules/firebase/init.js";
import { fbStorageMove, fbStorageUpload } from "../../modules/firebase/storage.js";
import { resizeImage } from "../../modules/util/dataConversion.js";
import { UploadedImage } from "../user.js";

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
 */
export function notifyProgress(smallPercent, mediumPercent, largePercent, notify) {
  const combinedPercent = (smallPercent + mediumPercent + largePercent) / 3;
  notify(`Uploading: ${combinedPercent.toFixed(2)}% completed`, "info");
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
  const small = await smallTask.monitor().getDownloadURL();

  /* --------------------- MEDIUM PHOTO --------------------- */
  const mediumimg = await resizeImage(
    image,
    { w: UploadedImage.Sizes.MEDIUM },
    image.type
  );
  const mediumTask = fbStorageUpload(mediumpath, mediumimg);
  mediumTask.onProgress = (percent) => notifyProgress(100, percent, 0, notify);
  const medium = await mediumTask.monitor().getDownloadURL();

  /* --------------------- LARGE PHOTO --------------------- */
  const largeimg = await resizeImage(
    image,
    { w: UploadedImage.Sizes.LARGE },
    image.type
  );
  const largeTask = fbStorageUpload(largepath, largeimg);
  largeTask.onProgress = (percent) => notifyProgress(100, 100, percent, notify);
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
      `Cannot change visibility: ${idKey} identity not found`
    );
  }

  const targetVisibilityCode = visibility === "PRIVATE" ? Date.now() : "PUBLIC";

  // if old and new codes are same, no need to move, return as is
  if (oldVisibilityCode === "" + targetVisibilityCode) {
    return null;
  }

  const smallTask = fbStorageMove(
    StoragePaths.IdentityDocuments(userId, oldVisibilityCode, idType, UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL), // prettier-ignore
    StoragePaths.IdentityDocuments(userId, targetVisibilityCode, idType, UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL) // prettier-ignore
  );
  const medTask = fbStorageMove(
    StoragePaths.IdentityDocuments(userId, oldVisibilityCode, idType, UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM), // prettier-ignore
    StoragePaths.IdentityDocuments(userId, targetVisibilityCode, idType, UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM) // prettier-ignore
  );
  const largeTask = fbStorageMove(
    StoragePaths.IdentityDocuments(userId, oldVisibilityCode, idType, UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE), // prettier-ignore
    StoragePaths.IdentityDocuments(userId, targetVisibilityCode, idType, UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE) // prettier-ignore
  );

  const small = await smallTask.then((task) => {
    task.onProgress = (percent) => notifyProgress(percent, 0, 0, notify);
    task.monitor();
    return task.getDownloadURL();
  });
  const medium = await medTask.then((task) => {
    task.onProgress = (percent) => notifyProgress(100, percent, 0, notify);
    task.monitor();
    return task.getDownloadURL();
  });
  const large = await largeTask.then((task) => {
    task.onProgress = (percent) => notifyProgress(100, 100, percent, notify);
    task.monitor();
    return task.getDownloadURL();
  });

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
