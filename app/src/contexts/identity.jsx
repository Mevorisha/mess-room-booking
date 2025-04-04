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
 * Provides an identity management context to update identity photos and their visibility.
 *
 * This provider wraps its children with context functions that handle:
 * - Uploading and updating identity photos (work and government IDs) with file processing, cache management, and user context updates.
 * - Changing the visibility settings for the identity photos.
 *
 * Notifications are displayed to inform the user about the progress and success of these operations.
 *
 * @param {{ children: any }} props - The child elements rendered within the identity provider.
 * @returns {React.JSX.Element} A context provider supplying identity photo management functions.
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
