import { FirebaseAuth } from "../firebase/init";
import { errorHandlerWrapperOnCallApi } from "./api";
import { CachePaths } from "./caching";
import { fileToDataUrl } from "./dataConversion";

const FILE_LOADER_CACHE_PATH = CachePaths.FILE_LOADER;

export async function fetchAsDataUrl(url: string, requireAuth = false): Promise<string> {
  // keep blob and data urls as is
  // will add more if needed
  // we only want network urls to be fetched and cached
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  const cache = await caches.open(FILE_LOADER_CACHE_PATH);
  const cachedRes = await cache.match(url);
  if (cachedRes != null) {
    const result = await cachedRes.text();
    // console.warn("ImageLoader: found", url, ": size:", result.length);
    return result;
  }

  const headers: Record<string, string> = {};
  if (requireAuth) {
    headers["X-Firebase-Token"] = (await FirebaseAuth.currentUser?.getIdToken()) ?? "";
  }

  // Fetch the image from the URL
  const response = await errorHandlerWrapperOnCallApi(async () => fetch(url, { headers }));
  const isBase64 = response.headers.get("x-content-encoding")?.toUpperCase() === "BASE64";

  if (isBase64) {
    let base64string = await response.text();
    const contentType = response.headers.get("x-decoded-content-type") ?? "application/octet-stream";
    base64string = `data:${contentType};base64,${base64string}`;
    await cache.put(url, new Response(base64string, { status: 200 }));
    return base64string;
  } else {
    const blob = await response.blob();
    const file = new File([blob], "unknown.bin", { type: blob.type });
    const base64string = await fileToDataUrl(file);
    await cache.put(url, new Response(base64string, { status: 200 }));
    return base64string;
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
