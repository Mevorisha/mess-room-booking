import { FirebaseAuth } from "@/modules/firebase/init.js";
import { lang } from "./language.js";
import * as config from "@/modules/config.js";

export type MultiSizeImageSz = "small" | "medium" | "large";

export interface RoomQuery {
  self?: boolean;
  acceptGender?: "MALE" | "FEMALE" | "OTHER";
  acceptOccupation?: "STUDENT" | "PROFESSIONAL" | "ANY";
  landmark?: string;
  city?: string;
  state?: string;
  capacity?: number;
  lowPrice?: number;
  highPrice?: number;
  searchTags?: string[];
  sortOn?: "capacity" | "rating" | "pricePerOccupant";
  sortOrder?: "asc" | "desc";
  page?: number;
  invalidateCache?: boolean;
}

export interface JsonDataType {
  message?: string;
  error?: string;
}

export class ApiPaths {
  static ACCOUNTS = `${config.API_SERVER_URL}/api/accounts`;
  static BOOKINGS = `${config.API_SERVER_URL}/api/bookings`;
  static ID_DOCS = `${config.API_SERVER_URL}/api/identityDocs`;
  static PROFILE = `${config.API_SERVER_URL}/api/profile`;
  static ROOMS = `${config.API_SERVER_URL}/api/rooms`;
  static LOGS = `${config.API_SERVER_URL}/api/logs`;

  // prettier-ignore
  static Accounts = {
    delete: (uid: string): string => `${ApiPaths.ACCOUNTS}/${uid}/delete`,
    read: (uid: string): string => `${ApiPaths.ACCOUNTS}/${uid}/read`,
  }

  // prettier-ignore
  static Bookings = {
    create: (): string => `${ApiPaths.BOOKINGS}/create`,
    readListOnQuery: (): string => `${ApiPaths.BOOKINGS}/readListOnQuery`,
    read: (bookingId: string): string => `${ApiPaths.BOOKINGS}/${bookingId}/read`,
    updateIsAccepted: (bookingId: string): string => `${ApiPaths.BOOKINGS}/${bookingId}/updateIsAccepted`,
    updateIsClearedOrCancelled: (bookingId: string): string => `${ApiPaths.BOOKINGS}/${bookingId}/updateIsClearedOrCancelled`,
  }

  // prettier-ignore
  static IdentityDocs = {
    readImage: (type: "GOV_ID" | "WORK_ID", uid: string, size: MultiSizeImageSz): string => `${ApiPaths.ID_DOCS}/${uid}/${type}/readImage?size=${size}`,
    updateImage: (type: "GOV_ID" | "WORK_ID", uid: string): string => `${ApiPaths.ID_DOCS}/${uid}/${type}/updateImage`,
    updateVisibility: (type: "GOV_ID" | "WORK_ID", uid: string): string => `${ApiPaths.ID_DOCS}/${uid}/${type}/updateVisibility`,
  };

  // prettier-ignore
  static Profile = {
    create: (): string => `${ApiPaths.PROFILE}/create`,
    read: (uid: string): string => `${ApiPaths.PROFILE}/${uid}/read`,
    readImage: (uid: string, size: MultiSizeImageSz): string => `${ApiPaths.PROFILE}/${uid}/readImage?size=${size}`,
    updateLanguage: (uid: string): string => `${ApiPaths.PROFILE}/${uid}/updateLanguage`,
    updateMobile: (uid: string): string => `${ApiPaths.PROFILE}/${uid}/updateMobile`,
    updateName: (uid: string): string => `${ApiPaths.PROFILE}/${uid}/updateName`,
    updatePhoto: (uid: string): string => `${ApiPaths.PROFILE}/${uid}/updatePhoto`,
    updateType: (uid: string): string => `${ApiPaths.PROFILE}/${uid}/updateType`,
  };

  // prettier-ignore
  static Rooms = {
    create: (): string => `${ApiPaths.ROOMS}/create`,
    delete: (roomId: string, force?: boolean): string => `${ApiPaths.ROOMS}/${roomId}/delete?force=${force ?? false}`,
    restore: (roomId: string): string => `${ApiPaths.ROOMS}/${roomId}/restore`,
    readListOnQuery: (query: RoomQuery = {}): string => {
      const params = new URLSearchParams();
      if (null != query.self) params.append("self", "" + query.self);
      if (null != query.acceptGender) params.append("acceptGender", query.acceptGender);
      if (null != query.acceptOccupation) params.append("acceptOccupation", query.acceptOccupation);
      if (null != query.landmark) params.append("landmark", query.landmark);
      if (null != query.city) params.append("city", query.city);
      if (null != query.state) params.append("state", query.state);
      if (null != query.capacity) params.append("capacity", "" + query.capacity);
      if (null != query.lowPrice) params.append("lowPrice", "" + query.lowPrice);
      if (null != query.highPrice) params.append("highPrice", "" + query.highPrice);
      if (null != query.searchTags && query.searchTags.length > 0) params.append("searchTags", query.searchTags.join(","));
      if (null != query.sortOn) params.append("sortOn", query.sortOn);
      if (null != query.sortOrder) params.append("sortOrder", query.sortOrder);
      if (null != query.page) params.append("page", "" + query.page);
      if (null != query.invalidateCache) params.append("invalidateCache", "" + query.invalidateCache);
      const queryString = params.toString();
      return `${ApiPaths.ROOMS}/readListOnQuery${(queryString.length > 0) ? "?" + queryString : ""}`;
    },
    read: (roomId: string): string => `${ApiPaths.ROOMS}/${roomId}/read`,
    readRating: (roomId: string): string => `${ApiPaths.ROOMS}/${roomId}/readRating`,
    updateUnavailability: (roomId: string): string => `${ApiPaths.ROOMS}/${roomId}/updateUnavailability`,
    updateParams: (roomId: string): string => `${ApiPaths.ROOMS}/${roomId}/updateParams`,

    Clients: {
      readRating: (roomId: string, uid: string): string => `${ApiPaths.ROOMS}/${roomId}/${uid}/readRating`,
      updateRating: (roomId: string, uid: string): string => `${ApiPaths.ROOMS}/${roomId}/${uid}/updateRating`,
    },

    Images: {
      readImage: (roomId: string, imageId: string, size: MultiSizeImageSz): string => `${ApiPaths.ROOMS}/${roomId}/${imageId}/readImage?size=${size}`,
    },
  };

  static Logs = {
    put: (type: "info" | "error"): string => `${ApiPaths.LOGS}/put?type=${type}`,
  };
}

async function errorHandlerWrapperOnCallApi(callback: () => Promise<Response>): Promise<Response> {
  try {
    const response = await callback();
    if (response.ok) return response;
    else {
      const contentType = response.headers.get("content-type");
      const isJson = contentType?.includes("application/json") ?? false;
      const jsonData: JsonDataType | null = isJson ? ((await response.json()) as JsonDataType) : null;
      if (jsonData?.message != null) {
        return Promise.reject(new Error(jsonData.message));
      } else if (jsonData?.error != null) {
        return Promise.reject(new Error(jsonData.error));
      } else {
        return Promise.reject(
          new Error(
            lang(
              `Unknown error with status ${response.status}`,
              `অজানা সমস্যা, স্ট্যাটাস ${response.status}`,
              `अज्ञात त्रुटि, स्टेटस ${response.status}`
            )
          )
        );
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return Promise.reject(
      new Error(lang("Unknown error on API call", "এপিআই কলের সময় অজানা সমস্যা", "एपीआई कॉल पर अज्ञात त्रुटि"))
    );
  }
}

export async function apiGetOrDelete(
  method: "GET" | "DELETE",
  path: string
): Promise<{ json?: object; blob?: Blob; text?: string }> {
  const response = await errorHandlerWrapperOnCallApi(async () =>
    fetch(path, {
      method,
      headers: {
        "X-Firebase-Token": (await FirebaseAuth.currentUser?.getIdToken()) ?? "",
        "Content-Type": "application/json",
      },
    })
  );
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json") ?? false;
  const isText = contentType?.includes("text/plain") ?? false;
  if (isJson) {
    return { json: (await response.json()) as object };
  } else if (isText) {
    return { text: await response.text() };
  } else {
    return { blob: await response.blob() };
  }
}

/**
 * @param {"POST" | "PATCH"} method
 * @param {string} path The API call path. Get this from ApiPaths class
 * @param {Object} json
 * @returns {Promise<Object>}
 */
export async function apiPostOrPatchJson(method: "POST" | "PATCH", path: string, json: object): Promise<object> {
  const resonse = await errorHandlerWrapperOnCallApi(async () =>
    fetch(path, {
      method,
      headers: {
        "X-Firebase-Token": (await FirebaseAuth.currentUser?.getIdToken()) ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json),
    })
  );
  return (await resonse.json()) as object;
}

/**
 * @param {"POST" | "PATCH"} method
 * @param {string} path The API call path. Get this from ApiPaths class
 * @param {File} file
 * @returns {Promise<Object>}
 */
export async function apiPostOrPatchFile(method: "POST" | "PATCH", path: string, file: File): Promise<object> {
  const formData = new FormData();
  formData.append(file.name, file);
  const resonse = await errorHandlerWrapperOnCallApi(async () =>
    fetch(path, {
      method,
      headers: {
        "X-Firebase-Token": (await FirebaseAuth.currentUser?.getIdToken()) ?? "",
        // "Content-Type": "", <-- To be set by browser for formdata, DO NOT set manually
      },
      body: formData,
    })
  );
  return (await resonse.json()) as object;
}
