import { IS_DEV } from "@/modules/config";
import { FirebaseAuth } from "@/modules/firebase/init";
import { errorHandlerWrapperOnCallApi } from "./api";
import { CachePaths } from "./caching";
import { fileToDataUrl } from "./dataConversion";

const FILE_LOADER_CACHE_PATH = CachePaths.FILE_LOADER;
const CACHE_EXPIRATION_OFFSET_7D = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_EXPIRATION_OFFSET_7S = 7 * 1000; // 7 seconds

interface CachedDataType {
  base64DataUrl: string;
  expiration: number;
}

async function cleanupExpiredCache(cache: Cache): Promise<void> {
  try {
    const keys = await cache.keys();
    const now = Date.now();
    for (const request of keys) {
      const response = await cache.match(request);
      if (response == null) continue;
      try {
        const data = (await response.json()) as CachedDataType | null;
        if (data?.expiration != null && data.expiration < now) {
          await cache.delete(request);
        }
      } catch (e) {
        // If we can't parse the response as JSON, it might be old format or corrupted
        // Delete it to be safe
        console.error(`Error parsing cache ${request.url}:`, e);
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error("Error cleaning up cache:", error);
  }
}

export async function fetchAsDataUrl(url: string, requireAuth = false): Promise<string> {
  // keep blob and data urls as is
  // will add more if needed
  // we only want network urls to be fetched and cached
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  const cacheExpiratnOffset = IS_DEV ? CACHE_EXPIRATION_OFFSET_7S : CACHE_EXPIRATION_OFFSET_7D;

  const cache = await caches.open(FILE_LOADER_CACHE_PATH);
  const cachedRes = await cache.match(url);
  if (cachedRes != null) {
    const result = (await cachedRes.json()) as CachedDataType | null;
    if (result?.base64DataUrl != null) {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => void cleanupExpiredCache(cache));
      } else {
        setTimeout(() => void cleanupExpiredCache(cache), 0);
      }
      // console.warn("ImageLoader: found", url, ": size:", result.length);
      return result.base64DataUrl;
    }
  }

  const headers: Record<string, string> = {};
  if (requireAuth) {
    headers["X-Firebase-Token"] = (await FirebaseAuth.currentUser?.getIdToken()) ?? "";
  }

  // Fetch the image from the URL
  const response = await errorHandlerWrapperOnCallApi(async () => fetch(url, { headers }));
  const isBase64 = response.headers.get("x-content-encoding")?.toUpperCase() === "BASE64";

  if (isBase64) {
    let base64DataUrl = await response.text();
    const contentType = response.headers.get("x-decoded-content-type") ?? "application/octet-stream";
    base64DataUrl = `data:${contentType};base64,${base64DataUrl}`;
    const expiration = Date.now() + cacheExpiratnOffset;
    const result = JSON.stringify({ base64DataUrl, expiration });
    await cache.put(url, new Response(result, { status: 200 }));
    return base64DataUrl;
  } else {
    const blob = await response.blob();
    const file = new File([blob], "unknown.bin", { type: blob.type });
    const base64DataUrl = await fileToDataUrl(file);
    const expiration = Date.now() + cacheExpiratnOffset;
    const result = JSON.stringify({ base64DataUrl, expiration });
    await cache.put(url, new Response(result, { status: 200 }));
    return base64DataUrl;
  }
}

// Queue to manage pending requests
let fetchQueue = Promise.resolve();

/**
 * Wrapper function that serializes fetchAsDataUrl calls
 * Only one request will execute at a time
 */
export async function serialFetchAsDataUrl(url: string, requireAuth = false): Promise<string> {
  // Create a new promise that will resolve with our result
  let resolveOuterPromise: (value: string | PromiseLike<string>) => void;
  const outerPromise = new Promise<string>((resolve) => {
    resolveOuterPromise = resolve;
  });

  // Queue this request by chaining it to the existing queue
  fetchQueue = fetchQueue
    .then(async () => {
      try {
        // Execute the actual fetch
        const result = await fetchAsDataUrl(url, requireAuth);
        resolveOuterPromise(result);
      } catch (error) {
        resolveOuterPromise(Promise.reject(error as Error));
      }
    })
    .catch(() => {
      // Catch errors in the queue chain but don't stop the queue
      // This ensures the queue continues processing even if one request fails
    });

  // Return the promise that will resolve when this request is done
  return outerPromise;
}
