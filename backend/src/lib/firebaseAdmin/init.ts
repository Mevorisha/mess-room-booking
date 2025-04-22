import admin from "firebase-admin";
import { App, getApp, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Database, getDatabase } from "firebase-admin/database";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import * as config from "../config";

export type MultiSizeImageSz = "small" | "medium" | "large";

let FirebaseApp: App | null = null;
let FirebaseAuth: Auth;
let FirebaseRtDb: Database;
let FirebaseFirestore: Firestore;
let FirebaseStorage: Storage;
let alreadyInit = false;

// Without this try-catch-finally, next.js hot-reload causes firebase re-init and hence error
// If you're gonna modify this code test the following
// npm run dev the live dev server
// Visit any api endpoint
// Make a change in code
// Reload the API endoint
// If no error, you're good to go
// Errors if any will appear in console and in web frontend
try {
  FirebaseApp = initializeApp(
    {
      projectId: config.FIREBASE_PROJECT_ID,
      credential: admin.credential.cert(config.FIREBASE_SERVICE_ACCOUNT_KEY),
      databaseURL: config.RUN_ON_EMULATOR ? config.FIREBASE_EMULATOR_DATABASE_URL : config.FIREBASE_DATABASE_URL,
      storageBucket: config.RUN_ON_EMULATOR ? config.FIREBASE_EMULATOR_STORAGE_BUCKET : config.FIREBASE_STORAGE_BUCKET,
    },
    config.FIREBASE_PROJECT_ID
  );

  alreadyInit = false;
} catch (e) {
  FirebaseApp = getApp(config.FIREBASE_PROJECT_ID);

  alreadyInit = true;
} finally {
  if (FirebaseApp == null) {
    throw new Error("FirebaseApp is null");
  }
  FirebaseAuth = getAuth(FirebaseApp);
  FirebaseRtDb = getDatabase(FirebaseApp);
  FirebaseFirestore = getFirestore(FirebaseApp);
  FirebaseStorage = getStorage(FirebaseApp);

  if (!alreadyInit && config.RUN_ON_EMULATOR) {
    FirebaseFirestore.settings({ host: config.FIREBASE_FIRESTORE_EMULATOR_HOST, ssl: false });
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
  static SCHEDULER_TIMES = !config.IS_DEV ? "/fstr_SchedulerTimes" : "/preview_fstr_SchedulerTimes";
  static ROOM_RATINGS = !config.IS_DEV ? "/fstr_RoomRatings" : "/preview_fstr_RoomRatings";
  static INDEX_TRACKER = !config.IS_DEV ? "/fstr_IndexTracker" : "/preview_fstr_IndexTracker";

  static Identity = (uid: string) => FirebaseFirestore.collection(FirestorePaths.IDENTITY).doc(uid);

  static Logs = (uid: string) => FirebaseFirestore.collection(FirestorePaths.LOGS).doc(uid);

  static Feedback = () => FirebaseFirestore.collection(FirestorePaths.FEEDBACK);

  static Rooms = (roomId: string) => FirebaseFirestore.collection(FirestorePaths.ROOMS).doc(roomId);

  static Bookings = (bookingId: string) => FirebaseFirestore.collection(FirestorePaths.BOOKINGS).doc(bookingId);

  static SchedulerTimes = () => FirebaseFirestore.collection(FirestorePaths.SCHEDULER_TIMES);

  static RoomRatings = () => FirebaseFirestore.collection(FirestorePaths.ROOM_RATINGS);

  static IndexTracker = () => FirebaseFirestore.collection(FirestorePaths.INDEX_TRACKER);
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

    apiUri: (uid: string, size: MultiSizeImageSz, b64 = true): string =>
      `${config.ApiPaths.PROFILE}/${uid}/readImage?size=${size}&b64=${b64}`,
  };

  static IdentityDocuments = {
    gsBucket: (uid: string, type: "WORK_ID" | "GOV_ID", w: number, h: number): string =>
      `${StoragePaths.IDENTITY_DOCUMENTS}/${uid}/${type}/0/${w}/${h}`,

    apiUri: (uid: string, type: "WORK_ID" | "GOV_ID", size: MultiSizeImageSz, b64 = true) =>
      `${config.ApiPaths.ID_DOCS}/${uid}/${type}/readImage?size=${size}&b64=${b64}`,
  };

  static RoomPhotos = {
    gsBucket: (roomId: string, imageId: string, size: MultiSizeImageSz): string =>
      `${StoragePaths.ROOM_PHOTOS}/${roomId}/${imageId}/${size}`,

    getImageIdFromGsPath: (gsPath: string): string => gsPath.split("/").reverse()[1] ?? "",

    apiUri: (roomId: string, imageId: string, size: MultiSizeImageSz, b64 = true): string =>
      `${config.ApiPaths.ROOMS}/${roomId}/${imageId}/readImage?size=${size}&b64=${b64}`,
  };

  static FeedbackPhotos = (uid: string, code: string): string => `${StoragePaths.FEEDBACK_PHOTOS}/${uid}/${code}`;
}

export { FirebaseApp, FirebaseAuth, FirebaseRtDb, FirebaseFirestore, FirebaseStorage, FirestorePaths, StoragePaths };
