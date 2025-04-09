import React, { createContext, useCallback, useContext } from "react";
import UserContext, { UploadedImage } from "./user.jsx";
import useNotification from "@/hooks/notification.js";
import { lang } from "@/modules/util/language.js";
import { ApiPaths, apiPostOrPatchFile, apiPostOrPatchJson } from "@/modules/util/api.js";
import { CachePaths } from "@/modules/util/caching.js";
import { FirebaseAuth } from "@/modules/firebase/init.js";
import { updateProfile } from "firebase/auth";

/* ---------------------------------- PROFILE CONTEXT OBJECT ----------------------------------- */

/**
 * @typedef  {Object} ProfileContextType
 * @property {(type: "TENANT" | "OWNER")                     => Promise<void>}     updateProfileType
 * @property {(image: File)                                  => Promise<string>}   updateProfilePhoto
 * @property {(firstName: string, lastName: string)          => Promise<void>}     updateProfileName
 */

const ProfileContext = createContext(
  /** @type {ProfileContextType} */ ({
    updateProfileType: async () => {},
    updateProfilePhoto: async () => "",
    updateProfileName: async () => {},
  })
);

export default ProfileContext;

/* ------------------------------------ AUTH PROVIDER COMPONENT ----------------------------------- */

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export function ProfileProvider({ children }) {
  const notify = useNotification();
  const { user, dispatchUser } = useContext(UserContext);

  /* ------------------------------------ AUTH CONTEXT PROVIDER API FN ----------------------------------- */

  const updateProfileType = useCallback(
    /**
     * @param {"TENANT" | "OWNER"} type
     * @returns {Promise<void>}
     */
    async (type) =>
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
        .catch((e) => notify(e, "error")),
    [user.uid, notify, dispatchUser]
  );

  const updateProfilePhoto = useCallback(
    /**
     * @param {File} image
     * @returns {Promise<string>}
     */
    async (image) => {
      // update auth profile
      await apiPostOrPatchFile("PATCH", ApiPaths.Profile.updatePhoto(user.uid), image);
      const { small, medium, large } = {
        small: ApiPaths.Profile.readImage(user.uid, "small"),
        medium: ApiPaths.Profile.readImage(user.uid, "medium"),
        large: ApiPaths.Profile.readImage(user.uid, "large"),
      };
      const cache = await caches.open(CachePaths.IMAGE_LOADER);
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
    /**
     * @param {string} firstName
     * @param {string} lastName
     * @returns {Promise<void>}
     */
    async (firstName, lastName) =>
      apiPostOrPatchJson("PATCH", ApiPaths.Profile.updateName(user.uid), { firstName, lastName })
        .then(() => updateProfile(FirebaseAuth.currentUser, { displayName: `${firstName} ${lastName}` }))
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
        .catch((e) => notify(e, "error")),
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
