import React, { createContext, useCallback, useContext } from "react";
import UserContext, { UploadedImage } from "./user.js";
import useNotification from "../hooks/notification.js";
import { RtDbPaths, StoragePaths } from "../modules/firebase/init.js";
import { updateProfile as updateAuthProfile } from "../modules/firebase/auth.js";
import { fbRtdbDelete, fbRtdbUpdate } from "../modules/firebase/db.js";
import { fbStorageDelete } from "../modules/firebase/storage.js";
import { uploadThreeSizesFromOneImage } from "./utils/utils.js";

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
      fbRtdbUpdate(RtDbPaths.Identity(user.uid), { type })
        .then(() => dispatchUser({ type }))
        .then(() => notify("Profile type updated successfully", "success")),
    [user.uid, notify, dispatchUser]
  );

  const updateProfilePhoto = useCallback(
    /**
     * @param {File} image
     * @returns {Promise<string>}
     */
    async (image) => {
      // delete exisiting photos before uploading
      await fbStorageDelete(StoragePaths.ProfilePhotos(user.uid, UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL)); // prettier-ignore
      await fbStorageDelete(StoragePaths.ProfilePhotos(user.uid, UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM)); // prettier-ignore
      await fbStorageDelete(StoragePaths.ProfilePhotos(user.uid, UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE)); // prettier-ignore
      await fbRtdbDelete(RtDbPaths.Identity(user.uid) + "/profilePhotos");

      const uploadedImages = await uploadThreeSizesFromOneImage(
        user.uid,
        "PUBLIC",

        // three paths for upload
        StoragePaths.ProfilePhotos(user.uid, UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL), // prettier-ignore
        StoragePaths.ProfilePhotos(user.uid, UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM), // prettier-ignore
        StoragePaths.ProfilePhotos(user.uid, UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE), // prettier-ignore

        image, // the file itself
        notify // notify callback
      );

      const { small, medium, large } = uploadedImages;

      // update auth profile
      await updateAuthProfile({ photoURL: medium });
      await fbRtdbUpdate(RtDbPaths.Identity(user.uid) + "/profilePhotos", {
        small,
        medium,
        large,
      });

      dispatchUser({ profilePhotos: uploadedImages });
      notify("Profile photo updated successfully", "success");

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
      updateAuthProfile({ firstName, lastName })
        .then(() => dispatchUser({ firstName, lastName }))
        .then(() => notify("Profile name updated successfully", "success")),
    [notify, dispatchUser]
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
