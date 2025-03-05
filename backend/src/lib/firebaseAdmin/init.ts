import admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as config from "../config";

export type MultiSizeImageSz = "small" | "medium" | "large";

let FirebaseApp = null;
let FirebaseRtDb = null;
let FirebaseFirestore = null;
let FirebaseStorage = null;

// Without this if-else check, next.js hot-reload causes firebase re-init and hence error
if (!admin.apps.length) {
  FirebaseApp = initializeApp(
    {
      projectId: config.FIREBASE_PROJECT_ID,
      credential: admin.credential.cert(config.FIREBASE_SERVICE_ACCOUNT_KEY),
      databaseURL: config.RUN_ON_EMULATOR ? config.FIREBASE_DATABASE_URL : "localhost:9002",
      storageBucket: config.RUN_ON_EMULATOR ? config.FIREBASE_STORAGE_BUCKET : "localhost:9003",
    },
    config.FIREBASE_PROJECT_ID
  );

  FirebaseRtDb = getDatabase(FirebaseApp);
  FirebaseFirestore = getFirestore(FirebaseApp);
  FirebaseStorage = getStorage(FirebaseApp);

  if (config.RUN_ON_EMULATOR) {
    FirebaseFirestore.settings({ host: "localhost:9004", ssl: false });
  }
}

/**
 * Firestore paths
 */
class FirestorePaths {
  static IDENTITY = !config.IS_DEV ? "/fstr_Identity" : "/preview_fstr_Identity";
  static LOGS = !config.IS_DEV ? "/fstr_Logs" : "/preview_fstr_Logs";
  static FEEDBACK = !config.IS_DEV ? "/fstr_Feedback" : "/preview_fstr_Feedback";
  static ROOMS = !config.IS_DEV ? "/fstr_Rooms" : "/preview_fstr_Rooms";
  static BOOKINGS = !config.IS_DEV ? "/fstr_Bookings" : "/preview_fstr_Bookings";

  static Identity = (uid: string) => getFirestore(FirebaseApp).collection(FirestorePaths.IDENTITY).doc(uid);

  static Logs = (uid: string) => getFirestore(FirebaseApp).collection(FirestorePaths.LOGS).doc(uid);

  static Feedback = () => getFirestore(FirebaseApp).collection(FirestorePaths.FEEDBACK);

  static Rooms = (roomId: string) => getFirestore(FirebaseApp).collection(FirestorePaths.ROOMS).doc(roomId);

  static Bookings = (bookingId: string) => getFirestore(FirebaseApp).collection(FirestorePaths.BOOKINGS).doc(bookingId);
}

/**
 * Storage paths
 */
class StoragePaths {
  static PROFILE_PHOTOS = !config.IS_DEV ? "/storg_ProfilePhotos" : "/preview_storg_ProfilePhotos";
  static ROOM_PHOTOS = !config.IS_DEV ? "/storg_RoomPhotos" : "/preview_storg_RoomPhotos";
  static IDENTITY_DOCUMENTS = !config.IS_DEV ? "/storg_IdentityDocuments" : "/preview_storg_IdentityDocuments";
  static FEEDBACK_PHOTOS = !config.IS_DEV ? "/storg_FeedbackPhotos" : "/preview_storg_FeedbackPhotos";

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
export { FirebaseApp, FirebaseRtDb, FirebaseFirestore, FirebaseStorage, FirestorePaths, StoragePaths };
