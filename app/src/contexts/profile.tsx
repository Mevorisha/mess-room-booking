import React, { createContext, useCallback, useContext } from "react";
import UserContext from "./user.jsx";
import useNotification from "@/hooks/notification.js";
import { lang } from "@/modules/util/language.js";
import { ApiPaths, apiPostOrPatchFile, apiPostOrPatchJson } from "@/modules/util/api.js";
import { CachePaths } from "@/modules/util/caching.js";
import { FirebaseAuth } from "@/modules/firebase/init.js";
import { updateProfile } from "firebase/auth";
import {
  ProfilePatchReqBodyDTO,
  IdentityType,
  HttpMethodTypes,
  MultiSizeImageSz,
  MultiSizePhotoDTO,
} from "sharedtypes";

/* ---------------------------------- PROFILE CONTEXT OBJECT ----------------------------------- */

export interface ProfileContextType {
  updateProfileType: (type: IdentityType) => Promise<void>;
  updateProfilePhoto: (image: File) => Promise<string>;
  updateProfileName: (firstName: string, lastName: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  updateProfileType: async () => Promise.reject(new Error()),
  updateProfilePhoto: async () => Promise.reject(new Error()),
  updateProfileName: async () => Promise.reject(new Error()),
});

export default ProfileContext;

/* ------------------------------------ AUTH PROVIDER COMPONENT ----------------------------------- */

export function ProfileProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const notify = useNotification();
  const { user, setUser } = useContext(UserContext);

  /* ------------------------------------ AUTH CONTEXT PROVIDER API FN ----------------------------------- */

  const updateProfileType = useCallback(
    async (type: IdentityType): Promise<void> => {
      const postBodyResult = ProfilePatchReqBodyDTO.Type.create({ type });
      if (postBodyResult.isErr) {
        notify(postBodyResult.error, "error");
        return;
      }
      await apiPostOrPatchJson(HttpMethodTypes.PATCH, ApiPaths.Profile.updateType(user.uid), postBodyResult.value) // prettier-ignore
        .then(() => setUser((user) => user?.clone().set("type", type)))
        .then(() =>
          notify(
            lang(
              "Profile type updated successfully",
              "প্রোফাইল টাইপ সফলভাবে আপডেট করা হয়েছে",
              "प्रोफ़ाइल टाइप सफलतापूर्वक अपडेट किया गया है"
            ),
            "success"
          )
        )
        .catch((e: Error) => notify(e, "error"));
    },
    [user.uid, notify, setUser]
  );

  const updateProfilePhoto = useCallback(
    async (image: File): Promise<string> => {
      // update auth profile
      await apiPostOrPatchFile(HttpMethodTypes.PATCH, ApiPaths.Profile.updatePhoto(user.uid), image);
      const { small, medium, large } = {
        small: ApiPaths.Profile.readImage(user.uid, MultiSizeImageSz.SMALL),
        medium: ApiPaths.Profile.readImage(user.uid, MultiSizeImageSz.MEDIUM),
        large: ApiPaths.Profile.readImage(user.uid, MultiSizeImageSz.LARGE),
      };
      const cache = await caches.open(CachePaths.FILE_LOADER);
      await Promise.all([cache.delete(small), cache.delete(medium), cache.delete(large)]);
      const photosDTO = MultiSizePhotoDTO.create({ small, medium, large }).unwrapOrThrow();
      // SAME AS ABOVE:
      // const photosResult = MultiSizePhotoDTO.create({ small, medium, large });
      // if (photosResult.isErr) {
      //   return Promise.reject(photosResult.error);
      // }
      setUser((user) => user?.clone().set("profilePhotos", photosDTO));
      notify(
        lang(
          "Profile photo updated successfully",
          "প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে",
          "प्रोफ़ाइल फोटो सफलतापूर्वक अपडेट किया गया है"
        ),
        "success"
      );

      return medium;
    },
    [user.uid, notify, setUser]
  );

  const updateProfileName = useCallback(
    async (firstName: string, lastName: string): Promise<void> => {
      const postBodyResult = ProfilePatchReqBodyDTO.Name.create({ firstName, lastName });
      if (postBodyResult.isErr) {
        notify(postBodyResult.error, "error");
        return;
      }
      await apiPostOrPatchJson(HttpMethodTypes.PATCH, ApiPaths.Profile.updateName(user.uid), postBodyResult.value)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .then(() => updateProfile(FirebaseAuth.currentUser!, { displayName: `${firstName} ${lastName}` }))
        .then(() => setUser((user) => user?.clone().set("firstName", firstName).set("lastName", lastName)))
        .then(() =>
          notify(
            lang(
              "Profile name updated successfully",
              "প্রোফাইল নাম সফলভাবে আপডেট করা হয়েছে",
              "प्रोफ़ाइल नाम सफलतापूर्वक अपडेट किया गया है"
            ),
            "success"
          )
        )
        .catch((e: Error) => notify(e, "error"));
    },
    [user.uid, notify, setUser]
  );

  return (
    <ProfileContext.Provider
      value={{
        updateProfileType,
        updateProfilePhoto,
        updateProfileName,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
