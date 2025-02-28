import { getStorage } from "firebase-admin/storage";
import { ApiError } from "../lib/utils/ApiError";

interface UrlCacheData {
  url: string;
  expires: number;
}

const UrlCache = new Map<string, UrlCacheData>();

export async function imagePathToUrl(data: object, param: string) {
  try {
    if (data[param]) {
      const imgPaths = data[param];
      const imgUrls = {};
      const bucket = getStorage().bucket();
      for (const size of Object.keys(imgPaths)) {
        const path = imgPaths[size];
        const accessDelay = /* 2 min */ 2 * 60 * 1000;

        // If a is private field is found, do
        // not allow access to pubic URL.
        // ^
        // |
        // *----- This is to be implemented at API rather than mode
        //        and hence is commented out. This is to ensure the
        //        auth user can access the private image but another
        //        user cannot.

        if (UrlCache.has(path) && UrlCache.get(path)) {
          const { url, expires } = UrlCache.get(path) as UrlCacheData;
          // The delay offset implies a time when the link will be accessed by the user
          // This takes care of any delays
          if (Date.now() < expires - accessDelay) {
            imgUrls[size] = url;
            continue;
          }
        }

        const file = bucket.file(path);
        const expires = Date.now() + /* 15 min */ 15 * 60 * 1000;
        const [signedUrl] = await file.getSignedUrl({ action: "read", expires });

        UrlCache.set(path, { url: signedUrl, expires });
        imgUrls[size] = signedUrl;
      }
      data[param] = imgUrls;
    }
  } catch (e) {
    return Promise.reject(ApiError.create(500, e.message));
  }
}
