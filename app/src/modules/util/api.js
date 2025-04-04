import { FirebaseAuth } from "@/modules/firebase/init.js";
import { lang } from "./language.js";
import * as config from "@/modules/config.js";

/**
 * @typedef {"small"|"medium"|"large"} MultiSizeImageSz
 */

export class ApiPaths {
  static ACCOUNTS = `${config.API_SERVER_URL}/api/accounts`;
  static BOOKINGS = `${config.API_SERVER_URL}/api/bookings`;
  static ID_DOCS = `${config.API_SERVER_URL}/api/identityDocs`;
  static PROFILE = `${config.API_SERVER_URL}/api/profile`;
  static ROOMS = `${config.API_SERVER_URL}/api/rooms`;
  static LOGS = `${config.API_SERVER_URL}/api/logs`;

  // prettier-ignore
  static Accounts = {
    /** @param {string} uid */
    delete: (uid) => `${ApiPaths.ACCOUNTS}/${uid}/delete`,

    /** @param {string} uid */
    read: (uid) => `${ApiPaths.ACCOUNTS}/${uid}/read`,
  }

  // prettier-ignore
  static Bookings = {
    create: () => `${ApiPaths.BOOKINGS}/create`,

    readListOnQuery: () => `${ApiPaths.BOOKINGS}/readListOnQuery`,

    /** @param {string} bookingId */
    read: (bookingId) => `${ApiPaths.BOOKINGS}/${bookingId}/read`,

    /** @param {string} bookingId */
    updateIsAccepted: (bookingId) => `${ApiPaths.BOOKINGS}/${bookingId}/updateIsAccepted`,

    /** @param {string} bookingId */
    updateIsClearedOrCancelled: (bookingId) => `${ApiPaths.BOOKINGS}/${bookingId}/updateIsClearedOrCancelled`,
  }

  // prettier-ignore
  static IdentityDocs = {
    /**
     * @param { "GOV_ID" | "WORK_ID" } type
     * @param {string} uid
     * @param {MultiSizeImageSz} size
     */
    readImage: (type, uid, size) => `${ApiPaths.ID_DOCS}/${uid}/${type}/readImage?size=${size}`,

    /**
     * @param { "GOV_ID" | "WORK_ID" } type
     * @param {string} uid
     */
    updateImage: (type, uid) => `${ApiPaths.ID_DOCS}/${uid}/${type}/updateImage`,

    /**
     * @param { "GOV_ID" | "WORK_ID" } type
     * @param {string} uid
     */
    updateVisibility: (type, uid) => `${ApiPaths.ID_DOCS}/${uid}/${type}/updateVisibility`,
  };

  // prettier-ignore
  static Profile = {
    create: () => `${ApiPaths.PROFILE}/create`,

    /** @param {string} uid */
    read: (uid) => `${ApiPaths.PROFILE}/${uid}/read`,

    /**
     * @param {string} uid
     * @param {MultiSizeImageSz} size
     */
    readImage: (uid, size) => `${ApiPaths.PROFILE}/${uid}/readImage?size=${size}`,

    /** @param {string} uid */
    updateLanguage: (uid) => `${ApiPaths.PROFILE}/${uid}/updateLanguage`,

    /** @param {string} uid */
    updateMobile: (uid) => `${ApiPaths.PROFILE}/${uid}/updateMobile`,

    /** @param {string} uid */
    updateName: (uid) => `${ApiPaths.PROFILE}/${uid}/updateName`,

    /** @param {string} uid */
    updatePhoto: (uid) => `${ApiPaths.PROFILE}/${uid}/updatePhoto`,

    /** @param {string} uid */
    updateType: (uid) => `${ApiPaths.PROFILE}/${uid}/updateType`,
  };

  // prettier-ignore
  static Rooms = {
    create: () => `${ApiPaths.ROOMS}/create`,

    readListOnQuery: () => `${ApiPaths.ROOMS}/readListOnQuery`,

    /** @param {string} roomId */
    createImage: (roomId) => `${ApiPaths.ROOMS}/${roomId}/createImage`,

    /** @param {string} roomId */
    read: (roomId) => `${ApiPaths.ROOMS}/${roomId}/read`,

    /** @param {string} roomId */
    updateAvailability: (roomId) => `${ApiPaths.ROOMS}/${roomId}/updateAvailability`,

    /** @param {string} roomId */
    updateParams: (roomId) => `${ApiPaths.ROOMS}/${roomId}/updateParams`,

    Images: {
      /**
       * @param {string} roomId
       * @param {string} imageId
       */
      delete: (roomId, imageId) => `${ApiPaths.ROOMS}/${roomId}/${imageId}/delete`,

      /**
       * @param {string} roomId
       * @param {string} imageId
       * @param {MultiSizeImageSz} size
       */
      readImage: (roomId, imageId, size) => `${ApiPaths.ROOMS}/${roomId}/${imageId}/readImage?size=${size}`,

      /**
       * @param {string} roomId
       * @param {string} imageId
       */
      updateImage: (roomId, imageId) => `${ApiPaths.ROOMS}/${roomId}/${imageId}/updateImage`,
    },
  };

  static Logs = {
    /**
     * @param {"info" | "error"} type
     */
    put: (type) => `${ApiPaths.LOGS}/put?type=${type}`,
  };
}

/**
 * @param {() => Promise<Response>} callback
 */
async function errorHandlerWrapperOnCallApi(callback) {
  try {
    const response = await callback();

    if (response.ok) return response;
    else {
      const json = response.headers.get("content-type")?.includes("application/json") ? await response.json() : null;
      return Promise.reject(
        json?.message ||
          json?.error ||
          lang(
            `Unknown error with status ${response.status}`,
            `অজানা সমস্যা, স্ট্যাটাস ${response.status}`,
            `अज्ञात त्रुटि, स्टेटस ${response.status}`
          )
      );
    }
  } catch (e) {
    return Promise.reject(
      lang("Unknown error on API call", "এপিআই কলের সময় অজানা সমস্যা", "एपीआई कॉल पर अज्ञात त्रुटि")
    );
  }
}
/**
 * @param {"GET" | "DELETE"} method
 * @param {string} path The API call path. Get this from ApiPaths class
 * @returns {Promise<{ json?: Object, blob?: Blob, text?: string }>}
 */
export async function apiGetOrDelete(method, path) {
  const resonse = await errorHandlerWrapperOnCallApi(async () =>
    fetch(path, {
      method,
      headers: {
        "X-Firebase-Token": (await FirebaseAuth.currentUser?.getIdToken()) || "",
        "Content-Type": "application/json",
      },
    })
  );

  if (resonse.headers.get("content-type")?.includes("application/json")) {
    return { json: await resonse.json() };
  } else if (resonse.headers.get("content-type")?.includes("text/plain")) {
    return { text: await resonse.text() };
  } else {
    return { blob: await resonse.blob() };
  }
}

/**
 * @param {"POST" | "PATCH"} method
 * @param {string} path The API call path. Get this from ApiPaths class
 * @param {Object} json
 * @returns {Promise<Object>}
 */
export async function apiPostOrPatchJson(method, path, json) {
  const resonse = await errorHandlerWrapperOnCallApi(async () =>
    fetch(path, {
      method,
      headers: {
        "X-Firebase-Token": (await FirebaseAuth.currentUser?.getIdToken()) || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json),
    })
  );

  return await resonse.json();
}

/**
 * @param {"POST" | "PATCH"} method
 * @param {string} path The API call path. Get this from ApiPaths class
 * @param {File} file
 * @returns {Promise<Object>}
 */
export async function apiPostOrPatchFile(method, path, file) {
  const formData = new FormData();
  formData.append(file.name, file);

  const resonse = await errorHandlerWrapperOnCallApi(async () =>
    fetch(path, {
      method,
      headers: {
        "X-Firebase-Token": (await FirebaseAuth.currentUser?.getIdToken()) || "",
        // "Content-Type": "", <-- To be set by browser for formdata, DO NOT set manually
      },
      body: formData,
    })
  );

  return await resonse.json();
}
