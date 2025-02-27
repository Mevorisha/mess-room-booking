import * as admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "{}"
);

const FirebaseApp = initializeApp({
  projectId: "mess-booking-app-serverless",
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const IS_PREVIEW =
  !/localhost|127\.0\.0\.1/i.test(window.location.href) &&
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

/**
 * Firestore paths
 */
class FirestorePaths {
  static IDENTITY = !IS_PREVIEW ? "/fstr_Identity" : "/preview_fstr_Identity";
  static LOGS = !IS_PREVIEW ? "/fstr_Logs" : "/preview_fstr_Logs";
  static FEEDBACK = !IS_PREVIEW ? "/fstr_Feedback" : "/preview_fstr_Feedback";
  static ROOMS = !IS_PREVIEW ? "/fstr_Rooms" : "/preview_fstr_Rooms";
  static BOOKINGS = !IS_PREVIEW ? "/fstr_Bookings" : "/preview_fstr_Bookings";

  static Identity = (uid: string) =>
    getFirestore().collection(FirestorePaths.IDENTITY).doc(uid);

  static Logs = () => getFirestore().collection(FirestorePaths.LOGS);

  static Feedback = () => getFirestore().collection(FirestorePaths.FEEDBACK);

  static Rooms = (roomId: string) =>
    getFirestore().collection(FirestorePaths.ROOMS).doc(roomId);

  static Bookings = (bookingId: string) =>
    getFirestore().collection(FirestorePaths.BOOKINGS).doc(bookingId);
}

/**
 * Storage paths
 */
class StoragePaths {
  static PROFILE_PHOTOS = !IS_PREVIEW
    ? "/storg_ProfilePhotos"
    : "/preview_storg_ProfilePhotos";
  static ROOM_PHOTOS = !IS_PREVIEW
    ? "/storg_RoomPhotos"
    : "/preview_storg_RoomPhotos";
  static IDENTITY_DOCUMENTS = !IS_PREVIEW
    ? "/storg_IdentityDocuments"
    : "/preview_storg_IdentityDocuments";
  static FEEDBACK_PHOTOS = !IS_PREVIEW
    ? "/storg_FeedbackPhotos"
    : "/preview_storg_FeedbackPhotos";

  static ProfilePhotos = (
    uid: string,
    w: number | string,
    h: number | string
  ): string => `${StoragePaths.PROFILE_PHOTOS}/${uid}/${w}/${h}`;

  static RoomPhotos = (uid: string, code: string): string =>
    `${StoragePaths.ROOM_PHOTOS}/${uid}/${code}`;

  static IdentityDocuments = (
    uid: string,
    code: string | number,
    type: "WORK_ID" | "GOV_ID",
    w: number | string,
    h: number | string
  ): string =>
    `${StoragePaths.IDENTITY_DOCUMENTS}/${uid}/${type}/${code}/${w}/${h}`;

  static FeedbackPhotos = (uid: string, code: string): string =>
    `${StoragePaths.FEEDBACK_PHOTOS}/${uid}/${code}`;
}

export default admin;
export { FirebaseApp, FirestorePaths, StoragePaths, IS_PREVIEW };
