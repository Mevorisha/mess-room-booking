import * as admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as config from "../config.js";

export type MultiSizeImageSz = "small" | "medium" | "large";

const FirebaseApp = initializeApp({
  projectId: config.FIREBASE_PROJECT_ID,
  credential: admin.credential.cert(config.FIREBASE_SERVICE_ACCOUNT_KEY),
  databaseURL: config.FIREBASE_DATABASE_URL,
  storageBucket: config.FIREBASE_STORAGE_BUCKET,
});

/**
 * Firestore paths
 */
class FirestorePaths {
  static IDENTITY = !config.IS_PREVIEW ? "/fstr_Identity" : "/preview_fstr_Identity";
  static LOGS = !config.IS_PREVIEW ? "/fstr_Logs" : "/preview_fstr_Logs";
  static FEEDBACK = !config.IS_PREVIEW ? "/fstr_Feedback" : "/preview_fstr_Feedback";
  static ROOMS = !config.IS_PREVIEW ? "/fstr_Rooms" : "/preview_fstr_Rooms";
  static BOOKINGS = !config.IS_PREVIEW ? "/fstr_Bookings" : "/preview_fstr_Bookings";

  static Identity = (uid: string) => getFirestore().collection(FirestorePaths.IDENTITY).doc(uid);

  static Logs = () => getFirestore().collection(FirestorePaths.LOGS);

  static Feedback = () => getFirestore().collection(FirestorePaths.FEEDBACK);

  static Rooms = (roomId: string) => getFirestore().collection(FirestorePaths.ROOMS).doc(roomId);

  static Bookings = (bookingId: string) => getFirestore().collection(FirestorePaths.BOOKINGS).doc(bookingId);
}

/**
 * Storage paths
 */
class StoragePaths {
  static PROFILE_PHOTOS = !config.IS_PREVIEW ? "/storg_ProfilePhotos" : "/preview_storg_ProfilePhotos";
  static ROOM_PHOTOS = !config.IS_PREVIEW ? "/storg_RoomPhotos" : "/preview_storg_RoomPhotos";
  static IDENTITY_DOCUMENTS = !config.IS_PREVIEW ? "/storg_IdentityDocuments" : "/preview_storg_IdentityDocuments";
  static FEEDBACK_PHOTOS = !config.IS_PREVIEW ? "/storg_FeedbackPhotos" : "/preview_storg_FeedbackPhotos";

  static ProfilePhotos = {
    gsBucket: (uid: string, w: number, h: number): string => `${StoragePaths.PROFILE_PHOTOS}/${uid}/${w}/${h}`,

    apiUri: (uid: string, size: MultiSizeImageSz): string => `${config.ApiPaths.PROFILE}/${uid}/readImage?size=${size}`,
  };

  static IdentityDocuments = {
    gsBucket: (uid: string, type: "WORK_ID" | "GOV_ID", w: number, h: number): string =>
      `${StoragePaths.IDENTITY_DOCUMENTS}/${uid}/${type}/0/${w}/${h}`,

    apiUri: (uid: string, type: "WORK_ID" | "GOV_ID", size: MultiSizeImageSz) =>
      `${config.ApiPaths.ID_DOCS}/${uid}/${type}/readImage?size=${size}`,
  };

  static RoomPhotos = {
    gsBucket: (roomId: string, imageId: string): string => `${StoragePaths.ROOM_PHOTOS}/${roomId}/${imageId}`,

    getImageIdFromGsPath: (gsPath: string) => gsPath.split("/").reverse()[0],

    apiUri: (roomId: string, imageId: string, size: MultiSizeImageSz = "large"): string =>
      `${config.ApiPaths.ROOMS}${roomId}/${imageId}/readImage?size=${size}`,
  };

  static FeedbackPhotos = (uid: string, code: string): string => `${StoragePaths.FEEDBACK_PHOTOS}/${uid}/${code}`;
}

export default admin;
export { FirebaseApp, FirestorePaths, StoragePaths };
