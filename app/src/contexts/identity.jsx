import React, { createContext, useCallback, useContext } from "react";
import useNotification from "@/hooks/notification.js";
import UserContext, { UploadedImage } from "./user.jsx";
import { lang } from "@/modules/util/language.js";
import { ApiPaths, apiPostOrPatchFile, apiPostOrPatchJson } from "@/modules/util/api.js";
import { CachePaths } from "@/modules/util/caching.js";

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
 * Provides identity management functionalities via React context.
 *
 * This component wraps its children with an IdentityContext.Provider that exposes asynchronous functions for
 * uploading identity photos and updating their visibility. It integrates with the user context to update state,
 * clear cached images, and notify the user when changes occur.
 *
 * @param {Object} props - Component properties.
 * @param {*} props.children - Child components that will have access to identity management functions.
 * @returns {React.JSX.Element} The provider element supplying identity management context.
 */

/**
 * Uploads identity documents and updates the user identity photo data.
 *
 * Processes the provided work and/or government ID files by uploading them, purging cached image versions, and
 * refreshing the user context with new image data. If neither file is provided, it returns early with undefined values.
 *
 * @param {Object} images - The identity document files to update.
 * @param {File} [images.workId] - Optional file for the work identification document.
 * @param {File} [images.govId] - Optional file for the government identification document.
 * @returns {Promise<Object>} Resolves with an object containing the medium image URLs for the updated documents.
 */

/**
 * Updates the visibility settings of identity documents.
 *
 * Sends requests to adjust the visibility (PUBLIC or PRIVATE) of specified identity photos and updates the user context accordingly.
 * The operation notifies the user throughout the process.
 *
 * @param {Object} images - Visibility settings for identity documents.
 * @param {"PUBLIC"|"PRIVATE"} [images.workId] - New visibility for the work ID document.
 * @param {"PUBLIC"|"PRIVATE"} [images.govId] - New visibility for the government ID document.
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
      if (!workId && !govId) return { workId: void 0, govId: void 0 };

      let uploadedWorkId;
      let uploadedGovId;

      if (workId || govId) {
        notify(
          lang(
            "Updating document(s), please wait...",
            "ডকুমেন্ট আপডেট করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...",
            "डॉक्यूमेंट अपडेट किया जा रहा है, कृपया प्रतीक्षा करें..."
          ),
          "info"
        );
      }

      // upload id
      if (workId) {
        await apiPostOrPatchFile("PATCH", ApiPaths.IdentityDocs.updateImage("WORK_ID", user.uid), workId);
        const { small, medium, large } = {
          small: ApiPaths.IdentityDocs.readImage("WORK_ID", user.uid, "small"),
          medium: ApiPaths.IdentityDocs.readImage("WORK_ID", user.uid, "medium"),
          large: ApiPaths.IdentityDocs.readImage("WORK_ID", user.uid, "large"),
        };
        const cache = await caches.open(CachePaths.IMAGE_LOADER);
        await Promise.all([cache.delete(small), cache.delete(medium), cache.delete(large)]);
        dispatchUser({ identityPhotos: { workId: new UploadedImage(user.uid, small, medium, large, true) } });
        uploadedWorkId = { small, medium, large };
      }

      // upload govId
      if (govId) {
        await apiPostOrPatchFile("PATCH", ApiPaths.IdentityDocs.updateImage("GOV_ID", user.uid), govId);
        const { small, medium, large } = {
          small: ApiPaths.IdentityDocs.readImage("GOV_ID", user.uid, "small"),
          medium: ApiPaths.IdentityDocs.readImage("GOV_ID", user.uid, "medium"),
          large: ApiPaths.IdentityDocs.readImage("GOV_ID", user.uid, "large"),
        };
        const cache = await caches.open(CachePaths.IMAGE_LOADER);
        await Promise.all([cache.delete(small), cache.delete(medium), cache.delete(large)]);
        dispatchUser({ identityPhotos: { govId: new UploadedImage(user.uid, small, medium, large, true) } });
        uploadedGovId = { small, medium, large };
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
      if (workId || govId) {
        notify(
          lang(
            "Changing visibility, please wait...",
            "গোপনীয়তা পরিবর্তন করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...",
            "गोपनीयता बदली जा रही है, कृपया प्रतीक्षा करें..."
          ),
          "info"
        );
      }

      if (workId) {
        const oldLocalImageObj = user.identityPhotos?.workId?.clone();
        const newLocalImageObj = workId === "PRIVATE" ? oldLocalImageObj?.makePrivate() : oldLocalImageObj?.makePublic(); // prettier-ignore
        await apiPostOrPatchJson("PATCH", ApiPaths.IdentityDocs.updateVisibility("WORK_ID", user.uid), { visibility: workId }); // prettier-ignore
        dispatchUser({ identityPhotos: { workId: newLocalImageObj } });
      }
      if (govId) {
        const oldLocalImageObj = user.identityPhotos?.govId?.clone();
        const newLocalImageObj = govId === "PRIVATE" ? oldLocalImageObj?.makePrivate() : oldLocalImageObj?.makePublic(); // prettier-ignore
        await apiPostOrPatchJson("PATCH", ApiPaths.IdentityDocs.updateVisibility("GOV_ID", user.uid), { visibility: govId }); // prettier-ignore
        dispatchUser({ identityPhotos: { govId: newLocalImageObj } });
      }
    },
    [user.uid, dispatchUser, user.identityPhotos?.govId, user.identityPhotos?.workId, notify]
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
