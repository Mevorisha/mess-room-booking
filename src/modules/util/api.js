import { lang } from "./language";

const API_ORIGIN = "";

class ApiPaths {
  static ACCOUNTS = "accounts";
  static BOOKINGS = "bookings";
  static ID_DOCS = "identityDocs";
  static PROFILE = "profile";
  static ROOMS = "rooms";

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
     */
    readImage: (type, uid) => `${ApiPaths.ID_DOCS}/${uid}/${type}/readImage`,

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
}

/**
 * @param {string} path The API call path. Get this from ApiPaths class
 * @param {RequestInit} init
 * @returns {Promise<Response>}
 */
export async function callApi(path, init) {
  try {
    const response = await fetch(`${API_ORIGIN}/${path}`, init);
    if (response.status < 400) return response;
    else {
      const json = response.headers.get("content-type")?.includes("application/json") ? await response.json() : null;
      return Promise.reject(
        json?.message ??
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
