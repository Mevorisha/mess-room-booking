import { FirebaseStorage } from "@/lib/firebaseAdmin/init";

// -------------------------------------------- TYPEDEFS -----------------------------------------------

export type AutoSetFields = "createdOn" | "lastModifiedOn" | "ttl";
export type ApiResponseUrlType = "GS_PATH" | "API_URI";

// -------------------------------------------- THIS FILE ---------------------------------------------------

interface UrlCacheData {
  url: string;
  expires: number;
  lastUsed: number;
}

const UrlCache = new Map<string, UrlCacheData>();

export async function gsPathToUrl(path: string): Promise<string> {
  const accessDelay = /* 2 min */ 2 * 60 * 1000;
  if (UrlCache.has(path) && UrlCache.get(path)) {
    const { url, expires } = UrlCache.get(path) as UrlCacheData;
    if (Date.now() < expires - accessDelay) {
      const lastUsed = Date.now();
      UrlCache.set(path, { url, expires, lastUsed });
      return url;
    } else {
      UrlCache.delete(path);
    }
  }

  const bucket = FirebaseStorage.bucket();
  const file = bucket.file(path);
  const expires = Date.now() + /* 15 min */ 15 * 60 * 1000;
  const lastUsed = Date.now();
  const [signedUrl] = await file.getSignedUrl({ action: "read", expires });

  UrlCache.set(path, { url: signedUrl, expires, lastUsed });

  // Schedule cache cleanup to run after returning the URL
  setTimeout(() => cleanupCache(), 0);

  return signedUrl;
}

// ----------------------------- CACHE CLEANUP ----------------------------

// Maximum number of entries to keep in cache
const MAX_CACHE_SIZE = 100;

// Function to clean up the cache
function cleanupCache() {
  const now = Date.now();

  // Remove expired entries
  for (const [path, data] of UrlCache.entries()) {
    if (now >= data.expires) {
      UrlCache.delete(path);
    }
  }

  // If still too many entries, remove least recently used
  if (UrlCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(UrlCache.entries());
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);

    // Remove oldest entries until we're back to MAX_CACHE_SIZE
    const entriesToRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    for (const [path] of entriesToRemove) {
      UrlCache.delete(path);
    }
  }
}
