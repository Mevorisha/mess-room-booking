import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  FirebaseAuth,
  RtDbPaths,
  StoragePaths,
} from "../modules/firebase/init.js";
import {
  EmailPasswdAuth,
  LinkMobileNumber,
  logOut as fbAuthLogOut,
  onAuthStateChanged,
  updateProfile as updateAuthProfile,
} from "../modules/firebase/auth.js";
import {
  fbRtdbDelete,
  fbRtdbRead,
  fbRtdbUpdate,
  onDbContentChange,
} from "../modules/firebase/db.js";
import {
  fbStorageDelete,
  fbStorageMove,
  fbStorageUpload,
} from "../modules/firebase/storage.js";
import { isEmpty } from "../modules/util/validations.js";
import { resizeImage } from "../modules/util/dataConversion.js";
import useNotification from "../hooks/notification.js";

const MODULE_NAME = "contexts/auth.js";

/* -------------------------------------- CONSTANTS ----------------------------------- */

/* -------------------------------------- TYPEDEFS ----------------------------------- */

/**
 * @typedef {(message: string, kind: "info" | "success" | "warning" | "error") => void} FnNotifier
 */

/* -------------------------------------- ENUMS ----------------------------------- */

/**
 * @enum {"STILL_LOADING" | "NOT_LOGGED_IN" | "LOGGED_IN"}
 */
export const AuthStateEnum = {
  STILL_LOADING: /** @type {"STILL_LOADING"} */ ("STILL_LOADING"),
  NOT_LOGGED_IN: /** @type {"NOT_LOGGED_IN"} */ ("NOT_LOGGED_IN"),
  LOGGED_IN: /**     @type {"LOGGED_IN"}     */ ("LOGGED_IN"),
};

/* ----------------------------- UPLOADED IMAGE CLASS w/ SIZES ------------------------- */

/**
 * @class
 */
export class UploadedImage {
  /**
   * @param {string} filename
   * @param {string} smallImageURL
   * @param {string} mediumImageURL
   * @param {string} largeImageURL
   */
  constructor(filename, smallImageURL, mediumImageURL, largeImageURL) {
    this.filename = filename;
    this.small = smallImageURL;
    this.medium = mediumImageURL;
    this.large = largeImageURL;
  }

  /** @returns {UploadedImage} */
  clone() {
    return new UploadedImage(
      this.filename,
      this.small,
      this.medium,
      this.large
    );
  }

  /** @enum {30 | 90 | 500} */
  static Sizes = {
    SMALL: /**  @type {30}  */ (30),
    MEDIUM: /** @type {90}  */ (90),
    LARGE: /**  @type {500} */ (500),
  };

  toString() {
    return JSON.stringify({
      filename: this.filename,
      small: this.small,
      medium: this.medium,
      large: this.large,
    });
  }
}

/* -------------------------------------- USER CLASS ----------------------------------- */

/**
 * @class
 */
export class User {
  /** @type {string} */
  uid;

  /** @type {string} */
  mobile;

  /** @type {string} */
  firstName;

  /** @type {string} */
  lastName;

  /** @type {UploadedImage | null} */
  profilePhotos;

  /** @type {{ workId?: UploadedImage, govId?: UploadedImage } | null} */
  identityPhotos;

  /** @type {"EMPTY" | "TENANT" | "OWNER"} */
  type;

  /**
   * The type is set to "EMPTY" by default.
   * Type is not included in the constructor because it is not available in Firebase Auth User object.
   * It is to be set using the setType method after the user details are fetched from the database.
   *
   * The profilePhotos is set to null by default.
   * PhotoURLs is not included in the constructor because multiple photo sizes are not available in
   * Firebase Auth User object. It is to be set using the setPhotoURL method after the user details
   * are fetched from the database.
   *
   * @param {string} uid
   * @param {string} mobile
   * @param {string} firstName
   * @param {string} lastName
   */
  constructor(uid, mobile = "", firstName = "", lastName = "") {
    this.uid = uid;
    this.mobile = mobile;
    this.firstName = firstName;
    this.lastName = lastName;
    this.profilePhotos = null;
    this.identityPhotos = null;
    this.type = "EMPTY";
  }

  /**
   * @returns {User}
   */
  static empty() {
    return new User("");
  }

  /**
   * Extracts user details from Firebase Auth User object.
   * @param {import("firebase/auth").User} user
   * @returns {User}
   */
  static fromFirebaseAuthUser(user) {
    return new User(
      user.uid,
      user.phoneNumber ?? "",
      user.displayName?.split(" ")[0] ?? "",
      user.displayName?.split(" ")[1] ?? ""
    );
  }

  /**
   * Loads the current user from Firebase Auth.
   * @returns {User}
   */
  static loadCurrentUser() {
    const authUser = FirebaseAuth.currentUser;
    if (!authUser) return User.empty();
    return User.fromFirebaseAuthUser(authUser);
  }

  /**
   * @returns {boolean}
   */
  isNotEmpty() {
    return this.uid !== "";
  }

  /**
   * @returns {User}
   */
  clone() {
    const user = new User(this.uid, this.mobile, this.firstName, this.lastName);

    if (!isEmpty(this.type))
      user.setType(/** @type {"TENANT" | "OWNER"} */ (this.type));

    if (this.profilePhotos) user.setProfilePhotos(this.profilePhotos.clone());
    if (this.identityPhotos) user.setIdentityPhotos({ ...this.identityPhotos });

    return user;
  }

  /**
   * Type does not exist on Firebase Auth User object.
   * Therefore, it is not included in the constructor.
   * @param {"TENANT" | "OWNER"} type
   * @returns {this}
   */
  setType(type) {
    this.type = type;
    return this;
  }

  /**
   * @param {UploadedImage} images
   * @returns {this}
   */
  setProfilePhotos(images) {
    this.profilePhotos = images;
    return this;
  }

  /**
   * @param {{ workId?: UploadedImage, govId?: UploadedImage }} images
   * @returns {this}
   */
  setIdentityPhotos(images) {
    if (!images.workId && !images.govId)
      throw new Error("At least one identity photo is required");

    this.identityPhotos = images;
    return this;
  }

  /**
   * @param {string} firstName
   * @param {string} lastName
   * @returns {this}
   */
  setProfileName(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
    return this;
  }

  /**
   * @param {string} mobile
   * @returns {this}
   */
  setMobile(mobile) {
    this.mobile = mobile;
    return this;
  }

  /**
   * @returns {string}
   */
  toString() {
    return JSON.stringify(this, null, 2);
  }
}

/* ---------------------------------- UTILS ----------------------------------- */
/**
 * Notify the user of the progress of uploading the images.
 * The progress is calculated as the average of the progress of each image.
 * @param {number} smallPercent - Progress of the small image
 * @param {number} mediumPercent - Progress of the medium image
 * @param {number} largePercent - Progress of the large image
 * @param {FnNotifier} notify
 */
function notifyProgress(smallPercent, mediumPercent, largePercent, notify) {
  const combinedPercent = (smallPercent + mediumPercent + largePercent) / 3;
  notify(`Uploading: ${combinedPercent.toFixed(2)}% completed`, "info");
}

/**
 * Creates 3 sizes of the given image and uploads them to Firebase Storage.
 * @param {string} uid
 * @param {string} smallpath
 * @param {string} mediumpath
 * @param {string} largepath
 * @param {File} image
 * @param {FnNotifier} notify
 * @returns {Promise<UploadedImage>}
 */
async function uploadThreeSizesFromOneImage(
  uid,
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
  const mediumTask = await fbStorageUpload(mediumpath, mediumimg);
  mediumTask.onProgress = (percent) => notifyProgress(0, percent, 0, notify);
  const medium = await mediumTask.monitor().getDownloadURL();

  /* --------------------- LARGE PHOTO --------------------- */
  const largeimg = await resizeImage(
    image,
    { w: UploadedImage.Sizes.LARGE },
    image.type
  );
  const largeTask = await fbStorageUpload(largepath, largeimg);
  largeTask.onProgress = (percent) => notifyProgress(0, 0, percent, notify);
  const large = await largeTask.monitor().getDownloadURL();

  return new UploadedImage(uid, small, medium, large);
}

/**
 * Updates the visibility of a user's identity document.
 * @param {string} userId - The unique identifier of the user.
 * @param {"work" | "gov"} idKey - The unique key associated with the identity document.
 * @param {"WORK_ID" | "GOV_ID"} idType - The type of identity document (work or government ID).
 * @param {"PRIVATE" | "PUBLIC"} visibility - Target visibility.
 * @param {FnNotifier} notify - A callback function to notify the user about the status of the operation.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
async function updateIdenityPhotosVisibilityGenreic(
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
    return;
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
    task.onProgress = (percent) => notifyProgress(0, percent, 0, notify);
    task.monitor();
    return task.getDownloadURL();
  });
  const large = await largeTask.then((task) => {
    task.onProgress = (percent) => notifyProgress(0, 0, percent, notify);
    task.monitor();
    return task.getDownloadURL();
  });

  // update RtDb
  await fbRtdbUpdate(RtDbPaths.Identity(userId), {
    identityPhotos: {
      [`${idKey}}Id`]: {
        small,
        medium,
        large,
        visibilityCode: targetVisibilityCode,
      },
    },
  });
}

/* ---------------------------------- AUTH CONTEXT OBJECT ----------------------------------- */

/**
 * @typedef {{
 *   type?: "TENANT" | "OWNER" | "EMPTY",
 *   photoURL?: string,
 *   mobile?: string,
 *   firstName?: string,
 *   lastName?: string
 * }} UserDetailsUpdatePayload
 *
 * @typedef {(uid: string, payload: UserDetailsUpdatePayload) => Promise<void>} FnUserDetailsUpdate
 *
 * @typedef  {Object} AuthContextType
 * @property {AuthStateEnum} state
 * @property {User} user
 * @property {(type: "TENANT" | "OWNER")                     => Promise<void>}     updateProfileType
 * @property {(image: File)                                  => Promise<string>}   updateProfilePhoto
 * @property {({ workId, govId }: { workId?: File, govId?: File }) =>
 *                                   Promise<{ workId?: string, govId?: string }>} updateIdentityPhotos
 * @property {({ workId, govId }:
 *             { workId?: "PUBLIC" | "PRIVATE"; govId?: "PUBLIC" | "PRIVATE"; })
 *                                                           => Promise<void>}     updateIdentityPhotosVisibility
 * @property {(firstName: string, lastName: string)          => Promise<void>}     updateProfileName
 * @property {(number: string)                               => Promise<void>}     sendPhoneVerificationCode
 * @property {(otp: string)                                  => Promise<void>}     verifyPhoneVerificationCode
 * @property {()                                             => Promise<void>}     unlinkPhoneNumber
 * @property {()                                             => Promise<void>}     requestPasswordReset
 * @property {()                                             => Promise<void>}     logOut
 */

const AuthContext = createContext(
  /** @type {AuthContextType} */ ({
    state: AuthStateEnum.STILL_LOADING,
    user: User.empty(),
    updateProfileType: async () => {},
    updateProfilePhoto: async () => "",
    updateIdentityPhotos: async () => [],
    updateIdentityPhotosVisibility: async () => {},
    updateProfileName: async () => {},
    sendPhoneVerificationCode: async () => {},
    verifyPhoneVerificationCode: async () => {},
    unlinkPhoneNumber: async () => {},
    requestPasswordReset: async () => {},
    logOut: async () => {},
  })
);

export default AuthContext;

/* ------------------------------------ AUTH PROVIDER COMPONENT ----------------------------------- */

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(
    /** @type {AuthStateEnum} */ (AuthStateEnum.STILL_LOADING)
  );
  const [finalUser, setFinalUser] = useState(User.loadCurrentUser());

  const notify = useNotification();

  /* A bit of knowledge for my future confused self:
   * useEffect is a hook that runs with following conditions:
   *     - the first time the component is rendered
   *     - when one of the dependencies changes
   * By this logic, useEffect should run only once, right? But in dev mode,
   * useEffect runs twice. This is documented in the following link:
   *     https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development
   *     Docs guarantee that useEffect will run once in production mode so :shrug:
   * On the first run, an auth listener is started.
   * On the 2nd run, a new auth listener is started. So the unsubscribe function
   * of the first listener is returned from useEffect as a cleanup function.
   * This stops the first listener and keeps only the 2nd listener active.
   */

  /* ------------------------------------ USE EFFECTS AUTH STATE LISTENER ----------------------------------- */

  /* listen for auth state changes and update the temporary user */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      if (null == user) setAuthState(AuthStateEnum.NOT_LOGGED_IN);
      else {
        setFinalUser(User.fromFirebaseAuthUser(user));
        /* mark as still loading as type and identity details are yet to be fetched from rtdb */
        setAuthState(AuthStateEnum.STILL_LOADING);
      }

      console.log(
        `${MODULE_NAME}::onAuthStateChanged: new user =`,
        user ? User.fromFirebaseAuthUser(user) : null
      );

      if (null == user) notify("You are not logged in", "warning");
    });

    return () => unsubscribe();
  }, [notify]);

  /* --------------------------------------- USE EFFECTS RTDB LISTENER ----------------------------------- */

  /* listen for changes at rtdb at RtDbPaths.IDENTITY/user.uid/ if temp user is updated
   * and update the final user with additional data from rtdb */
  useEffect(() => {
    if (!finalUser.uid) return;
    if (authState === AuthStateEnum.NOT_LOGGED_IN) return;

    /*
     * This useEffect is called twice in prod and 4 times in dev:
     * - 1. When state is STILL_LOADING: at this stage, additional data is fetched from RtDb.
     *      This state changes state to LOGGED_IN.
     * - 2. When state is LOGGED_IN: at this stage, updates to local state are fetched form RtDb.
     */

    const unsubscribe = onDbContentChange(
      RtDbPaths.Identity(finalUser.uid),
      (data) => {
        console.log(
          `${MODULE_NAME}::onDbContentChange: ${authState}: new data =`,
          data
        );

        if (!data) {
          setFinalUser(User.loadCurrentUser());
          setAuthState(AuthStateEnum.LOGGED_IN);
          return;
        }

        setFinalUser(() => {
          const newUser = User.loadCurrentUser();
          if (!isEmpty(data.type)) newUser.setType(data.type);
          if (!isEmpty(data.profilePhotos))
            newUser.setProfilePhotos(
              new UploadedImage(
                newUser.uid,
                data.profilePhotos.small,
                data.profilePhotos.medium,
                data.profilePhotos.large
              )
            );
          if (!isEmpty(data.identityPhotos))
            newUser.setIdentityPhotos({
              workId: data.identityPhotos.workId,
              govId: data.identityPhotos.govId,
            });
          return newUser;
        });

        setAuthState(AuthStateEnum.LOGGED_IN);
      }
    );

    return () => unsubscribe();
  }, [authState, finalUser.uid, setFinalUser]);

  /* ------------------------------------ AUTH CONTEXT PROVIDER API FN ----------------------------------- */

  const updateProfileType = useCallback(
    /**
     * @param {"TENANT" | "OWNER"} type
     * @returns {Promise<void>}
     */
    async (type) =>
      fbRtdbUpdate(RtDbPaths.Identity(finalUser.uid), { type })
        .then(() => setFinalUser((user) => user.clone().setType(type)))
        .then(() => notify("Profile type updated successfully", "success")),
    [finalUser.uid, notify]
  );

  const updateProfilePhoto = useCallback(
    /**
     * @param {File} image
     * @returns {Promise<string>}
     */
    async (image) => {
      // delete exisiting photos before uploading
      await fbStorageDelete(StoragePaths.ProfilePhotos(finalUser.uid, UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL)); // prettier-ignore
      await fbStorageDelete(StoragePaths.ProfilePhotos(finalUser.uid, UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM)); // prettier-ignore
      await fbStorageDelete(StoragePaths.ProfilePhotos(finalUser.uid, UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE)); // prettier-ignore
      await fbRtdbDelete(RtDbPaths.Identity(finalUser.uid) + "/profilePhotos");

      const uploadedImages = await uploadThreeSizesFromOneImage(
        finalUser.uid,

        // three paths for upload
        StoragePaths.ProfilePhotos(finalUser.uid, UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL), // prettier-ignore
        StoragePaths.ProfilePhotos(finalUser.uid, UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM), // prettier-ignore
        StoragePaths.ProfilePhotos(finalUser.uid, UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE), // prettier-ignore

        image, // the file itself
        notify // notify callback
      );

      const { small, medium, large } = uploadedImages;

      // update auth profile
      await updateAuthProfile({ photoURL: medium });
      await fbRtdbUpdate(RtDbPaths.Identity(finalUser.uid) + "/profilePhotos", {
        small,
        medium,
        large,
      });

      setFinalUser((user) => user.clone().setProfilePhotos(uploadedImages));
      notify("Profile photo updated successfully", "success");

      return medium;
    },
    [finalUser.uid, notify]
  );

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
          (
            await fbRtdbRead(
              RtDbPaths.Identity(finalUser.uid) +
                "/identityPhotos/workId/visibilityCode"
            )
          ) || undefined;

        // delete existing WORK_ID before uploading
        if (oldVisibilityCode) {
          await fbStorageDelete(StoragePaths.IdentityDocuments(finalUser.uid, oldVisibilityCode, "WORK_ID", UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL)); // prettier-ignore
          await fbStorageDelete(StoragePaths.IdentityDocuments(finalUser.uid, oldVisibilityCode, "WORK_ID", UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM)); // prettier-ignore
          await fbStorageDelete(StoragePaths.IdentityDocuments(finalUser.uid, oldVisibilityCode, "WORK_ID", UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE)); // prettier-ignore
          await fbRtdbDelete(RtDbPaths.Identity(finalUser.uid) + "/identityPhotos/workId"); // prettier-ignore
        }

        uploadedWorkId = await uploadThreeSizesFromOneImage(
          finalUser.uid,

          // three paths for upload
          StoragePaths.IdentityDocuments(finalUser.uid, visibilityCode, "WORK_ID", UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL), // prettier-ignore
          StoragePaths.IdentityDocuments(finalUser.uid, visibilityCode, "WORK_ID", UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM), // prettier-ignore
          StoragePaths.IdentityDocuments(finalUser.uid, visibilityCode, "WORK_ID", UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE), // prettier-ignore

          workId, // the file itself
          notify // notify callback
        );

        const { small, medium, large } = uploadedWorkId;
        await fbRtdbUpdate(
          RtDbPaths.Identity(finalUser.uid) + "/identityPhotos",
          {
            workId: { small, medium, large, visibilityCode },
          }
        );

        setFinalUser(
          (user) =>
          user.clone().setIdentityPhotos({ workId: uploadedWorkId, govId: user.identityPhotos?.govId }) // prettier-ignore
        );
      }

      // upload govId
      if (govId) {
        const visibilityCode = Date.now();
        const oldVisibilityCode =
          /** @type {string} */
          (
            await fbRtdbRead(
              RtDbPaths.Identity(finalUser.uid) +
                "/identityPhotos/govId/visibilityCode"
            )
          ) || undefined;

        // delete existing WORK_ID before uploading
        if (oldVisibilityCode) {
          await fbStorageDelete(StoragePaths.IdentityDocuments(finalUser.uid, oldVisibilityCode, "GOV_ID", UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL)); // prettier-ignore
          await fbStorageDelete(StoragePaths.IdentityDocuments(finalUser.uid, oldVisibilityCode, "GOV_ID", UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM)); // prettier-ignore
          await fbStorageDelete(StoragePaths.IdentityDocuments(finalUser.uid, oldVisibilityCode, "GOV_ID", UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE)); // prettier-ignore
          await fbRtdbDelete(RtDbPaths.Identity(finalUser.uid) + "/identityPhotos/govId"); // prettier-ignore
        }

        uploadedGovId = await uploadThreeSizesFromOneImage(
          finalUser.uid,

          // three paths for upload
          StoragePaths.IdentityDocuments(finalUser.uid, visibilityCode, "GOV_ID", UploadedImage.Sizes.SMALL, UploadedImage.Sizes.SMALL), // prettier-ignore
          StoragePaths.IdentityDocuments(finalUser.uid, visibilityCode, "GOV_ID", UploadedImage.Sizes.MEDIUM, UploadedImage.Sizes.MEDIUM), // prettier-ignore
          StoragePaths.IdentityDocuments(finalUser.uid, visibilityCode, "GOV_ID", UploadedImage.Sizes.LARGE, UploadedImage.Sizes.LARGE), // prettier-ignore

          govId,
          notify
        );

        const { small, medium, large } = uploadedGovId;
        await fbRtdbUpdate(
          RtDbPaths.Identity(finalUser.uid) + "/identityPhotos",
          {
            govId: { small, medium, large, visibilityCode },
          }
        );

        setFinalUser(
          (user) =>
          user.clone().setIdentityPhotos({ workId: user.identityPhotos?.workId, govId: uploadedGovId }) // prettier-ignore
        );
      }

      notify("Document(s) updated successfully", "success");

      return {
        workId: uploadedWorkId?.medium,
        govId: uploadedGovId?.medium,
      };
    },
    [finalUser.uid, notify]
  );

  const updateIdentityPhotosVisibility = useCallback(
    /**
     * @param {{ workId?: "PUBLIC" | "PRIVATE", govId?: "PUBLIC" | "PRIVATE" }} images
     */
    async ({ workId, govId }) => {
      if (workId) {
        await updateIdenityPhotosVisibilityGenreic(finalUser.uid, "work", "WORK_ID", workId, notify); // prettier-ignore
      }
      if (govId) {
        await updateIdenityPhotosVisibilityGenreic(finalUser.uid, "gov", "GOV_ID", govId, notify); // prettier-ignore
      }
    },
    [finalUser.uid, notify]
  );

  const updateProfileName = useCallback(
    /**
     * @param {string} firstName
     * @param {string} lastName
     * @returns {Promise<void>}
     */
    async (firstName, lastName) =>
      updateAuthProfile({ firstName, lastName })
        .then(() =>
          setFinalUser((user) =>
            user.clone().setProfileName(firstName, lastName)
          )
        )
        .then(() => notify("Profile name updated successfully", "success")),
    [notify]
  );

  const sendPhoneVerificationCode = useCallback(
    /**
     * @param {string} number
     * @returns {Promise<void>}
     */
    async (number) =>
      LinkMobileNumber.sendOtp(number).then(() =>
        notify("Check your mobile for OTP", "info")
      ),
    [notify]
  );

  const verifyPhoneVerificationCode = useCallback(
    /**
     * @param {string} otp
     * @returns {Promise<void>}
     */
    async (otp) =>
      LinkMobileNumber.verifyOtp(otp)
        .then((phno) =>
          isEmpty(phno)
            ? Promise.reject("Mobile number verification failed")
            : Promise.resolve(phno)
        )
        .catch(async (error) => {
          if (
            !(
              error.toString().toLowerCase().includes("provider") &&
              error.toString().toLowerCase().includes("already") &&
              error.toString().toLowerCase().includes("linked")
            )
          ) {
            return Promise.reject(error);
          }
          notify("Unlinking existing mobile number", "info");
          await LinkMobileNumber.unlinkPhoneNumber();
          notify("Verifying new mobile number", "info");
          return LinkMobileNumber.verifyOtp(otp);
        })
        .then((phno) => setFinalUser((user) => user.clone().setMobile(phno)))
        .then(() => notify("Mobile number verified successfully", "success")),

    [notify]
  );

  const unlinkPhoneNumber = useCallback(
    /**
     * @returns {Promise<void>}
     */
    async () =>
      LinkMobileNumber.unlinkPhoneNumber()
        .then(() => setFinalUser((user) => user.clone().setMobile("")))
        .then(() => notify("Mobile number unlinked successfully", "success")),
    [notify]
  );

  const requestPasswordReset = useCallback(
    /**
     * @returns {Promise<void>}
     */
    async () =>
      EmailPasswdAuth.requestPasswordReset().then(() =>
        notify("Check your email for password reset link", "info")
      ),
    [notify]
  );

  const logOut = useCallback(
    /**
     * @returns {Promise<void>}
     */
    () =>
      fbAuthLogOut()
        .then(() => notify("Logged out", "info"))
        .then(() => setFinalUser(User.empty())),
    [notify]
  );

  return (
    <AuthContext.Provider
      value={{
        state: authState,
        user: finalUser,
        updateProfileType,
        updateProfilePhoto,
        updateIdentityPhotos,
        updateIdentityPhotosVisibility,
        updateProfileName,
        sendPhoneVerificationCode,
        verifyPhoneVerificationCode,
        unlinkPhoneNumber,
        requestPasswordReset,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
