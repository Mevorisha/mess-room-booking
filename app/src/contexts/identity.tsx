import React, { createContext, useCallback, useContext } from "react";
import useNotification from "@/hooks/notification.js";
import UserContext from "./user.jsx";
import { lang } from "@/modules/util/language.js";
import { ApiPaths, apiPostOrPatchFile, apiPostOrPatchJson } from "@/modules/util/api.js";
import { CachePaths } from "@/modules/util/caching.js";
import {
  DocType,
  DocVisibility,
  HttpMethodTypes,
  IdentityPatchImageVisibilityDTO,
  IdentityPhotosDTO,
  MultiSizeImageSz,
  MultiSizePhotoDTO,
} from "sharedtypes";

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
    workId?: DocVisibility;
    govId?: DocVisibility;
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
  const { user, setUser } = useContext(UserContext);

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
        await apiPostOrPatchFile(HttpMethodTypes.PATCH, ApiPaths.IdentityDocs.updateImage(DocType.WORK_ID, user.uid), workId); // prettier-ignore
        const { small, medium, large } = {
          small: ApiPaths.IdentityDocs.readImage(DocType.WORK_ID, user.uid, MultiSizeImageSz.SMALL),
          medium: ApiPaths.IdentityDocs.readImage(DocType.WORK_ID, user.uid, MultiSizeImageSz.MEDIUM),
          large: ApiPaths.IdentityDocs.readImage(DocType.WORK_ID, user.uid, MultiSizeImageSz.LARGE),
        };
        const cache = await caches.open(CachePaths.FILE_LOADER);
        await Promise.all([cache.delete(small), cache.delete(medium), cache.delete(large)]);
        setUser((oldUser) => {
          const newUser = oldUser?.clone();
          let identityPhotos = newUser?.get("identityPhotos");
          if (identityPhotos == null) {
            const identityPhotosResult = IdentityPhotosDTO.create({});
            if (identityPhotosResult.isErr) {
              // doing error checks even though this should NOT fail
              notify(identityPhotosResult.error, "error");
              return oldUser;
            }
            identityPhotos = identityPhotosResult.value;
          }
          const photosResult = MultiSizePhotoDTO.create({ small, medium, large });
          if (photosResult.isErr) {
            // Handle error so that it is not thrown inside react
            notify(photosResult.error, "error");
            return oldUser;
          }
          identityPhotos.workId = photosResult.value;
          identityPhotos.workIdIsPrivate = true;
          newUser?.set("identityPhotos", identityPhotos);
          return newUser;
        });
        uploadedWorkId = { small, medium, large };
      }

      // upload govId
      if (govId != null) {
        await apiPostOrPatchFile(HttpMethodTypes.PATCH, ApiPaths.IdentityDocs.updateImage(DocType.GOV_ID, user.uid), govId); // prettier-ignore
        const { small, medium, large } = {
          small: ApiPaths.IdentityDocs.readImage(DocType.GOV_ID, user.uid, MultiSizeImageSz.SMALL),
          medium: ApiPaths.IdentityDocs.readImage(DocType.GOV_ID, user.uid, MultiSizeImageSz.MEDIUM),
          large: ApiPaths.IdentityDocs.readImage(DocType.GOV_ID, user.uid, MultiSizeImageSz.LARGE),
        };
        const cache = await caches.open(CachePaths.FILE_LOADER);
        await Promise.all([cache.delete(small), cache.delete(medium), cache.delete(large)]);
        setUser((oldUser) => {
          const newUser = oldUser?.clone();
          let identityPhotos = newUser?.get("identityPhotos");
          if (identityPhotos == null) {
            const identityPhotosResult = IdentityPhotosDTO.create({});
            // doing error checks even though this should NOT fail
            if (identityPhotosResult.isErr) {
              notify(identityPhotosResult.error, "error");
              return oldUser;
            }
            identityPhotos = identityPhotosResult.value;
          }
          const photosResult = MultiSizePhotoDTO.create({ small, medium, large });
          if (photosResult.isErr) {
            // Handle error so that it is not thrown inside react
            notify(photosResult.error, "error");
            return newUser;
          }
          identityPhotos.govId = photosResult.value;
          identityPhotos.govIdIsPrivate = true;
          newUser?.set("identityPhotos", identityPhotos);
          return newUser;
        });
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
    [user.uid, notify, setUser]
  );

  const updateIdentityPhotosVisibility = useCallback(
    async ({ workId, govId }: { workId?: DocVisibility; govId?: DocVisibility }) => {
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
        // Throw error so that it is handled in the promise chain rather than resolving here as success
        const postBody = IdentityPatchImageVisibilityDTO.create({ visibility: workId }).unwrapOrThrow();
        await apiPostOrPatchJson(HttpMethodTypes.PATCH, ApiPaths.IdentityDocs.updateVisibility(DocType.WORK_ID, user.uid), postBody); // prettier-ignore
        setUser((user) => {
          user = user?.clone();
          const identityPhotos = user?.get("identityPhotos");
          if (identityPhotos == null) return user;
          identityPhotos.workIdIsPrivate = workId === DocVisibility.PRIVATE;
          user?.set("identityPhotos", identityPhotos);
          return user;
        });
      }
      if (govId != null) {
        // Throw error so that it is handled in the promise chain rather than resolving here as success
        const postBody = IdentityPatchImageVisibilityDTO.create({ visibility: govId }).unwrapOrThrow();
        await apiPostOrPatchJson(HttpMethodTypes.PATCH, ApiPaths.IdentityDocs.updateVisibility(DocType.GOV_ID, user.uid), postBody); // prettier-ignore
        setUser((user) => {
          user = user?.clone();
          const identityPhotos = user?.get("identityPhotos");
          if (identityPhotos == null) return user;
          identityPhotos.govIdIsPrivate = govId === DocVisibility.PRIVATE;
          user?.set("identityPhotos", identityPhotos);
          return user;
        });
      }
    },
    [notify, user.uid, setUser]
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
