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

  /**
   * @param {string} uid - Unique identifier for the user.
   */
  static Identity = (uid) =>
    getFirestore().collection(FirestorePaths.IDENTITY).doc(uid);

  static Logs = () => getFirestore().collection(FirestorePaths.LOGS);

  static Feedback = () => getFirestore().collection(FirestorePaths.FEEDBACK);

  /**
   * @param {string} roomId - Unique identifier for the room.
   */
  static Rooms = (roomId) =>
    getFirestore().collection(FirestorePaths.ROOMS).doc(roomId);

  /**
   * @param {string} bookingId - Unique identifier for the booking.
   */
  static Bookings = (bookingId) =>
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

  /**
   * @param {string} uid - Unique identifier for the user.
   * @param {number | string} w - Width of the image.
   * @param {number| string} h - Height of the image.
   * @returns {string} Constructed storage path for the user's profile photos.
   */
  static ProfilePhotos = (uid, w, h) =>
    `${StoragePaths.PROFILE_PHOTOS}/${uid}/${w}/${h}`;

  /**
   * @param {string} uid - Unique identifier for the user.
   * @param {string} code - Unique identifier for the image. Set to "PUBLIC" if document is set public in app.
   * @returns {string} Constructed storage path for the user's mess photos.
   */
  static RoomPhotos = (uid, code) =>
    `${StoragePaths.ROOM_PHOTOS}/${uid}/${code}`;

  /**
   * @param {string} uid - Unique identifier for the user.
   * @param {string | number} code - Unique identifier for the image. Set to "PUBLIC" if document is set public in app.
   * @param {"WORK_ID" | "GOV_ID"} type - Type of the image, either "WORK_ID" or "GOV_ID".
   * @param {number | string} w - Width of the image.
   * @param {number| string} h - Height of the image.
   * @returns {string} Constructed storage path for the user's identity documents.
   */
  static IdentityDocuments = (uid, code, type, w, h) =>
    `${StoragePaths.IDENTITY_DOCUMENTS}/${uid}/${type}/${code}/${w}/${h}`;

  /**
   * @param {string} uid - Unique identifier for the user.
   * @param {string} code - Unique identifier for the image. Set to "PUBLIC" if document is set public in app.
   * @returns {string} Constructed storage path for the user's feedback photos.
   */
  static FeedbackPhotos = (uid, code) =>
    `${StoragePaths.FEEDBACK_PHOTOS}/${uid}/${code}`;
}

export default admin;
export { FirebaseApp, FirestorePaths, StoragePaths, IS_PREVIEW };
