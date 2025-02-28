import React, { createContext, useCallback, useContext } from "react";
import { RtDbPaths, StoragePaths } from "../modules/firebase/init.js";
import { fbRtdbDelete, fbRtdbRead, fbRtdbUpdate } from "../modules/firebase/db.js";
import { fbStorageDelete } from "../modules/firebase/storage.js";
import useNotification from "../hooks/notification.js";
import UserContext, { UploadedImage } from "./user.js";
import { updateIdenityPhotosVisibilityGenreic, uploadThreeSizesFromOneImage } from "./utils/utils.js";
import { lang } from "../modules/util/language.js";

/* ---------------------------------- IDENTITY CONTEXT OBJECT ----------------------------------- */

/**
 * @typedef  {Object} IdentityContextType
 * @property {({ workId, govId }: { workId?: File, govId?: File }) =>
 *                                   Promise<{ workId?: string, govId?: string }>} updateIdentityPhotos
 * @property {({ workId, govId }:
 *             { workId?: "PUBLIC" | "PRIVATE"; govId?: "PUBLIC" | "PRIVATE"; })
 *                                                           => Promise<void>}     updateIdentityPhotosVisibility
 */

const IdentityContext = createContext(
  /** @type {IdentityContextType} */ ({
    updateIdentityPhotos: async () => [],
    updateIdentityPhotosVisibility: async () => {},
  })
);

export default IdentityContext;

/* ------------------------------------ IDENTITY PROVIDER COMPONENT ----------------------------------- */

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export function IdentityProvider({ children }) {
  const notify = useNotification();
  const { user, dispatchUser } = useContext(UserContext);

  const updateIdentityPhotos = useCallback(
    /**
     * @param {{ workId?: File, govId?: File }} images
     * @returns {Promise<{ workId?: string, govId?: string }>}
     */
    async ({ workId, govId }) => {
      if (!workId && !govId) return { workId: undefined, govId: undefined };

      let uploadedWorkId;
      let uploadedGovId;

      // upload id
      if (workId) {
        const visibilityCode = Date.now();
        const oldVisibilityCode =
          /** @type {string} */
          (await fbRtdbRead(RtDbPaths.Identity(user.uid) + "/identityPhotos/workId/visibilityCode")) || undefined;

        // delete existing WORK_ID before uploading
        if (oldVisibilityCode) {
          await fbStorageDelete(StoragePaths.IdentityDocuments(user.uid, oldVisibilityCode, "WORK_ID", UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL)); // prettier-ignore
          await fbStorageDelete(StoragePaths.IdentityDocuments(user.uid, oldVisibilityCode, "WORK_ID", UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM)); // prettier-ignore
          await fbStorageDelete(StoragePaths.IdentityDocuments(user.uid, oldVisibilityCode, "WORK_ID", UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE)); // prettier-ignore
          await fbRtdbDelete(RtDbPaths.Identity(user.uid) + "/identityPhotos/workId"); // prettier-ignore
        }

        uploadedWorkId = await uploadThreeSizesFromOneImage(
          user.uid,
          visibilityCode,

          // three paths for upload
          StoragePaths.IdentityDocuments(user.uid, visibilityCode, "WORK_ID", UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL), // prettier-ignore
          StoragePaths.IdentityDocuments(user.uid, visibilityCode, "WORK_ID", UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM), // prettier-ignore
          StoragePaths.IdentityDocuments(user.uid, visibilityCode, "WORK_ID", UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE), // prettier-ignore

          workId, // the file itself
          notify // notify callback
        );

        const { small, medium, large } = uploadedWorkId;
        await fbRtdbUpdate(RtDbPaths.Identity(user.uid) + "/identityPhotos", {
          workId: { small, medium, large, visibilityCode },
        });

        dispatchUser({ identityPhotos: { workId: uploadedWorkId } });
      }

      // upload govId
      if (govId) {
        const visibilityCode = Date.now();
        const oldVisibilityCode =
          /** @type {string} */
          (await fbRtdbRead(RtDbPaths.Identity(user.uid) + "/identityPhotos/govId/visibilityCode")) || undefined;

        // delete existing WORK_ID before uploading
        if (oldVisibilityCode) {
          await fbStorageDelete(StoragePaths.IdentityDocuments(user.uid, oldVisibilityCode, "GOV_ID", UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL)); // prettier-ignore
          await fbStorageDelete(StoragePaths.IdentityDocuments(user.uid, oldVisibilityCode, "GOV_ID", UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM)); // prettier-ignore
          await fbStorageDelete(StoragePaths.IdentityDocuments(user.uid, oldVisibilityCode, "GOV_ID", UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE)); // prettier-ignore
          await fbRtdbDelete(RtDbPaths.Identity(user.uid) + "/identityPhotos/govId"); // prettier-ignore
        }

        uploadedGovId = await uploadThreeSizesFromOneImage(
          user.uid,
          visibilityCode,

          // three paths for upload
          StoragePaths.IdentityDocuments(user.uid, visibilityCode, "GOV_ID", UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL), // prettier-ignore
          StoragePaths.IdentityDocuments(user.uid, visibilityCode, "GOV_ID", UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM), // prettier-ignore
          StoragePaths.IdentityDocuments(user.uid, visibilityCode, "GOV_ID", UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE), // prettier-ignore

          govId,
          notify
        );

        const { small, medium, large } = uploadedGovId;
        await fbRtdbUpdate(RtDbPaths.Identity(user.uid) + "/identityPhotos", {
          govId: { small, medium, large, visibilityCode },
        });

        dispatchUser({ identityPhotos: { govId: uploadedGovId } });
      }

      notify(
        lang(
          "Document(s) updated successfully",
          "ডকুমেন্ট(গুলি) সফলভাবে আপডেট করা হয়েছে",
          "डॉक्युमेंट को सफलतापूर्वक अपडेट किया गया है"
        ),
        "success"
      );

      return {
        workId: uploadedWorkId?.medium,
        govId: uploadedGovId?.medium,
      };
    },
    [user.uid, notify, dispatchUser]
  );

  const updateIdentityPhotosVisibility = useCallback(
    /**
     * @param {{ workId?: "PUBLIC" | "PRIVATE", govId?: "PUBLIC" | "PRIVATE" }} images
     */
    async ({ workId, govId }) => {
      if (workId) {
        const uploaded = await updateIdenityPhotosVisibilityGenreic(user.uid, "work", "WORK_ID", workId, notify); // prettier-ignore
        if (!uploaded) return;
        dispatchUser({ identityPhotos: { workId: uploaded } });
      }
      if (govId) {
        const uploaded = await updateIdenityPhotosVisibilityGenreic(user.uid, "gov", "GOV_ID", govId, notify); // prettier-ignore
        if (!uploaded) return;
        dispatchUser({ identityPhotos: { govId: uploaded } });
      }
    },
    [user.uid, notify, dispatchUser]
  );

  return (
    <IdentityContext.Provider
      value={{
        updateIdentityPhotos,
        updateIdentityPhotosVisibility,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}
