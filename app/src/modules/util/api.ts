import { FirebaseAuth } from "@/modules/firebase/init.js";
import { lang } from "./language.js";
import * as config from "@/modules/config.js";
import {
  ADataTransferObj,
  DtoValidationError,
  HeaderTypes,
  HttpMethodTypes,
  LogType,
  NetworkType,
  Result,
  RoomGetReqQueryParamsWrapper,
  MultiSizeImageSz,
  DocType,
  Nullable,
} from "sharedtypes";

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
    readImage: (type: DocType, uid: string, size: MultiSizeImageSz, b64 = true): string => `${ApiPaths.ID_DOCS}/${uid}/${type}/readImage?size=${size}&b64=${b64}`,
    updateImage: (type: DocType, uid: string): string => `${ApiPaths.ID_DOCS}/${uid}/${type}/updateImage`,
    updateVisibility: (type: DocType, uid: string): string => `${ApiPaths.ID_DOCS}/${uid}/${type}/updateVisibility`,
  };

  // prettier-ignore
  static Profile = {
    create: (): string => `${ApiPaths.PROFILE}/create`,
    read: (uid: string): string => `${ApiPaths.PROFILE}/${uid}/read`,
    readImage: (uid: string, size: MultiSizeImageSz, b64 = true): string => `${ApiPaths.PROFILE}/${uid}/readImage?size=${size}&b64=${b64}`,
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
    readListOnQuery: (query: RoomGetReqQueryParamsWrapper): string => {
      const queryString = query.toQueryParams().toString();
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
      readImage: (roomId: string, imageId: string, size: MultiSizeImageSz, b64 = true): string => `${ApiPaths.ROOMS}/${roomId}/${imageId}/readImage?size=${size}&b64=${b64}`,
    },
  };

  static Logs = {
    put: (type: LogType): string => `${ApiPaths.LOGS}/put?type=${type}`,
  };
}

// ---------------------------------------- errorHandlerWrapperOnCallApi --------------------------------------------------

interface JsonDataType {
  message?: string;
  error?: string;
}

export async function errorHandlerWrapperOnCallApi(callback: () => Promise<Response>): Promise<Response> {
  try {
    const response = await callback();
    if (response.ok) return response;
    else {
      const contentType = response.headers.get("content-type");
      const isJson = contentType?.includes("application/json") ?? false;
      const jsonData: Nullable<JsonDataType> = isJson ? ((await response.json()) as JsonDataType) : null;
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

// ---------------------------------------- apiGetOrDelete --------------------------------------------------

export async function apiGetOrDelete(method: HttpMethodTypes.DELETE, path: string): Promise<{ json: NetworkType }>;

export async function apiGetOrDelete<T extends ADataTransferObj>(
  method: HttpMethodTypes.GET,
  path: string,
  dtoClass: { fromJson(data: NetworkType): Result<T, DtoValidationError> }
): Promise<{ dto: T }>;

export async function apiGetOrDelete(
  method: HttpMethodTypes.GET,
  path: string
): Promise<{ json?: NetworkType; blob?: Blob }>;

// Implementation
export async function apiGetOrDelete<T extends ADataTransferObj>(
  method: HttpMethodTypes.GET | HttpMethodTypes.DELETE,
  path: string,
  dtoClass?: { fromJson(data: NetworkType): Result<T, DtoValidationError> }
): Promise<{ json?: NetworkType; dto?: T; blob?: Blob }> {
  const response = await errorHandlerWrapperOnCallApi(async () =>
    fetch(path, {
      method,
      headers: {
        [HeaderTypes.X_FIREBASE_TOKEN]: (await FirebaseAuth.currentUser?.getIdToken()) ?? "",
        [HeaderTypes.CONTENT_TYPE]: "application/json",
      },
    })
  );

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json") ?? false;
  const isText = contentType?.includes("text/plain") ?? false;

  if (method === HttpMethodTypes.DELETE) {
    return { json: await response.json() };
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (method === HttpMethodTypes.GET && dtoClass != null && isJson) {
    const data = (await response.json()) as NetworkType;
    const dtoResult = dtoClass.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return { dto: dtoResult.value };
  }

  if (isJson) {
    return { json: await response.json() };
  } else if (isText) {
    // can return as plain text JSON
    return { json: await response.text() };
  } else {
    return { blob: await response.blob() };
  }
}

// ---------------------------------------- apiPostOrPatchJson --------------------------------------------------

export async function apiPostOrPatchJson(
  method: HttpMethodTypes.POST | HttpMethodTypes.PATCH,
  path: string,
  dto?: ADataTransferObj
): Promise<NetworkType> {
  const resonse = await errorHandlerWrapperOnCallApi(async () =>
    fetch(path, {
      method,
      headers: {
        [HeaderTypes.X_FIREBASE_TOKEN]: (await FirebaseAuth.currentUser?.getIdToken()) ?? "",
        [HeaderTypes.CONTENT_TYPE]: "application/json",
      },
      body: dto != null ? JSON.stringify(dto.toJSON()) : null,
    })
  );
  return resonse.json();
}

// ---------------------------------------- apiPostOrPatchFile --------------------------------------------------

export async function apiPostOrPatchFile(
  method: HttpMethodTypes.POST | HttpMethodTypes.PATCH,
  path: string,
  file: File
): Promise<NetworkType> {
  const formData = new FormData();
  formData.append(file.name, file);
  const resonse = await errorHandlerWrapperOnCallApi(async () =>
    fetch(path, {
      method,
      headers: {
        [HeaderTypes.X_FIREBASE_TOKEN]: (await FirebaseAuth.currentUser?.getIdToken()) ?? "",
        // [HeaderTypes.CONTENT_TYPE]: void 0, <-- To be set by browser for formdata, DO NOT set manually
      },
      body: formData,
    })
  );
  return resonse.json();
}
