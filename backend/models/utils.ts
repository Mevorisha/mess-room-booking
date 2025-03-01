import { getStorage } from "firebase-admin/storage";
import { ApiError } from "../lib/utils/ApiError";
import { StoragePaths } from "../lib/firebaseAdmin/init.js";

interface UrlCacheData {
  url: string;
  expires: number;
}

const UrlCache = new Map<string, UrlCacheData>();

export async function gsPathToUrl(path: string): Promise<string> {
  try {
    const accessDelay = /* 2 min */ 2 * 60 * 1000;
    if (UrlCache.has(path) && UrlCache.get(path)) {
      const { url, expires } = UrlCache.get(path) as UrlCacheData;
      if (Date.now() < expires - accessDelay) {
        return url;
      } else {
        UrlCache.delete(path);
      }
    }

    const bucket = getStorage().bucket();
    const file = bucket.file(path);
    const expires = Date.now() + /* 15 min */ 15 * 60 * 1000;
    const [signedUrl] = await file.getSignedUrl({ action: "read", expires });

    UrlCache.set(path, { url: signedUrl, expires });
    return signedUrl;
  } catch (e) {
    return Promise.reject(ApiError.create(500, e.message));
  }
}
