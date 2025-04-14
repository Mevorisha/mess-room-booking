import React, { createContext, useCallback, useContext } from "react";
import UserContext from "./user.jsx";
import useNotification from "@/hooks/notification.js";
import { lang } from "@/modules/util/language.js";
import { ApiPaths, apiPostOrPatchFile, apiPostOrPatchJson } from "@/modules/util/api.js";
import { CachePaths } from "@/modules/util/caching.js";
import { FirebaseAuth } from "@/modules/firebase/init.js";
import { updateProfile, User as FirebaseUser } from "firebase/auth";
import UploadedImage from "@/modules/classes/UploadedImage.js";

/* ---------------------------------- PROFILE CONTEXT OBJECT ----------------------------------- */

export interface ProfileContextType {
  updateProfileType: (type: "TENANT" | "OWNER") => Promise<void>;
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
  const { user, dispatchUser } = useContext(UserContext);

  /* ------------------------------------ AUTH CONTEXT PROVIDER API FN ----------------------------------- */

  const updateProfileType = useCallback(
    async (type: "TENANT" | "OWNER"): Promise<void> =>
      apiPostOrPatchJson("PATCH", ApiPaths.Profile.updateType(user.uid), { type })
        .then(() => dispatchUser({ type }))
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
        .catch((e: Error) => notify(e, "error")),
    [user.uid, notify, dispatchUser]
  );

  const updateProfilePhoto = useCallback(
    async (image: File): Promise<string> => {
      // update auth profile
      await apiPostOrPatchFile("PATCH", ApiPaths.Profile.updatePhoto(user.uid), image);
      const { small, medium, large } = {
        small: ApiPaths.Profile.readImage(user.uid, "small"),
        medium: ApiPaths.Profile.readImage(user.uid, "medium"),
        large: ApiPaths.Profile.readImage(user.uid, "large"),
      };
      const cache = await caches.open(CachePaths.FILE_LOADER);
      await Promise.all([cache.delete(small), cache.delete(medium), cache.delete(large)]);
      dispatchUser({ profilePhotos: new UploadedImage(user.uid, small, medium, large, false) });
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
    [user.uid, notify, dispatchUser]
  );

  const updateProfileName = useCallback(
    async (firstName: string, lastName: string): Promise<void> =>
      apiPostOrPatchJson("PATCH", ApiPaths.Profile.updateName(user.uid), { firstName, lastName })
        .then(() =>
          updateProfile(FirebaseAuth.currentUser as FirebaseUser, { displayName: `${firstName} ${lastName}` })
        )
        .then(() => dispatchUser({ firstName, lastName }))
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
        .catch((e: Error) => notify(e, "error")),
    [user.uid, notify, dispatchUser]
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
