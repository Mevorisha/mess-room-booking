import { FirebaseStorage } from "@/lib/firebaseAdmin/init";
import { CustomApiError } from "@/lib/utils/ApiError";

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

    const bucket = FirebaseStorage.bucket();
    const file = bucket.file(path);
    const expires = Date.now() + /* 15 min */ 15 * 60 * 1000;
    const [signedUrl] = await file.getSignedUrl({ action: "read", expires });

    UrlCache.set(path, { url: signedUrl, expires });
    return signedUrl;
  } catch (e) {
    return Promise.reject(CustomApiError.create(500, e.message));
  }
}
