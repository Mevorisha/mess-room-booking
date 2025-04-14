import React, { createContext, useCallback, useContext } from "react";
import useNotification from "@/hooks/notification.js";
import UserContext from "./user.jsx";
import { lang } from "@/modules/util/language.js";
import { ApiPaths, apiPostOrPatchFile, apiPostOrPatchJson } from "@/modules/util/api.js";
import { CachePaths } from "@/modules/util/caching.js";
import UploadedImage from "@/modules/classes/UploadedImage.js";

/* ---------------------------------- IDENTITY CONTEXT OBJECT ----------------------------------- */

export interface IdentityContextType {
  updateIdentityPhotos: ({
    workId,
    govId,
  }: {
    workId?: File;
    govId?: File;
  }) => Promise<{ workId?: string; govId?: string }>;
  updateIdentityPhotosVisibility: ({
    workId,
    govId,
  }: {
    workId?: "PUBLIC" | "PRIVATE";
    govId?: "PUBLIC" | "PRIVATE";
  }) => Promise<void>;
}

const IdentityContext = createContext<IdentityContextType>({
  updateIdentityPhotos: async () => Promise.reject(new Error()),
  updateIdentityPhotosVisibility: async () => Promise.reject(new Error()),
});

export default IdentityContext;

/* ------------------------------------ IDENTITY PROVIDER COMPONENT ----------------------------------- */

export function IdentityProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const notify = useNotification();
  const { user, dispatchUser } = useContext(UserContext);

  const updateIdentityPhotos = useCallback(
    async ({ workId, govId }: { workId?: File; govId?: File }): Promise<{ workId?: string; govId?: string }> => {
      if (workId == null && govId == null) return {};

      let uploadedWorkId;
      let uploadedGovId;

      if (workId != null || govId != null) {
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
      if (workId != null) {
        await apiPostOrPatchFile("PATCH", ApiPaths.IdentityDocs.updateImage("WORK_ID", user.uid), workId);
        const { small, medium, large } = {
          small: ApiPaths.IdentityDocs.readImage("WORK_ID", user.uid, "small"),
          medium: ApiPaths.IdentityDocs.readImage("WORK_ID", user.uid, "medium"),
          large: ApiPaths.IdentityDocs.readImage("WORK_ID", user.uid, "large"),
        };
        const cache = await caches.open(CachePaths.FILE_LOADER);
        await Promise.all([cache.delete(small), cache.delete(medium), cache.delete(large)]);
        dispatchUser({ identityPhotos: { workId: new UploadedImage(user.uid, small, medium, large, true) } });
        uploadedWorkId = { small, medium, large };
      }

      // upload govId
      if (govId != null) {
        await apiPostOrPatchFile("PATCH", ApiPaths.IdentityDocs.updateImage("GOV_ID", user.uid), govId);
        const { small, medium, large } = {
          small: ApiPaths.IdentityDocs.readImage("GOV_ID", user.uid, "small"),
          medium: ApiPaths.IdentityDocs.readImage("GOV_ID", user.uid, "medium"),
          large: ApiPaths.IdentityDocs.readImage("GOV_ID", user.uid, "large"),
        };
        const cache = await caches.open(CachePaths.FILE_LOADER);
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

      if (uploadedWorkId?.medium != null && uploadedGovId?.medium != null) {
        return { workId: uploadedWorkId.medium, govId: uploadedGovId.medium };
      } else if (uploadedWorkId?.medium != null && uploadedGovId?.medium == null) {
        return { workId: uploadedWorkId.medium };
      } else if (uploadedWorkId?.medium == null && uploadedGovId?.medium != null) {
        return { govId: uploadedGovId.medium };
      } else {
        return {};
      }
    },
    [user.uid, notify, dispatchUser]
  );

  const updateIdentityPhotosVisibility = useCallback(
    async ({ workId, govId }: { workId?: "PUBLIC" | "PRIVATE"; govId?: "PUBLIC" | "PRIVATE" }) => {
      if (workId != null || govId != null) {
        notify(
          lang(
            "Changing visibility, please wait...",
            "গোপনীয়তা পরিবর্তন করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...",
            "गोपनीयता बदली जा रही है, कृपया प्रतीक्षा करें..."
          ),
          "info"
        );
      }

      if (workId != null) {
        const oldLocalImageObj = user.identityPhotos?.workId?.clone();
        const newLocalImageObj = workId === "PRIVATE" ? oldLocalImageObj?.makePrivate() : oldLocalImageObj?.makePublic(); // prettier-ignore
        await apiPostOrPatchJson("PATCH", ApiPaths.IdentityDocs.updateVisibility("WORK_ID", user.uid), { visibility: workId }); // prettier-ignore
        if (newLocalImageObj != null) dispatchUser({ identityPhotos: { workId: newLocalImageObj } });
      }
      if (govId != null) {
        const oldLocalImageObj = user.identityPhotos?.govId?.clone();
        const newLocalImageObj = govId === "PRIVATE" ? oldLocalImageObj?.makePrivate() : oldLocalImageObj?.makePublic(); // prettier-ignore
        await apiPostOrPatchJson("PATCH", ApiPaths.IdentityDocs.updateVisibility("GOV_ID", user.uid), { visibility: govId }); // prettier-ignore
        if (newLocalImageObj != null) dispatchUser({ identityPhotos: { govId: newLocalImageObj } });
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
