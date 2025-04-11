import { FirebaseAuth } from "../firebase/init";
import { CachePaths } from "./caching";
import { fileToDataUrl } from "./dataConversion";
import { lang } from "./language";

const FILE_LOADER_CACHE_PATH = CachePaths.FILE_LOADER;

/**
 * @param {string} url
 * @param {boolean} [requireAuth]
 * @returns {Promise<string>}
 */
export async function fetchAsDataUrl(url, requireAuth = false) {
  // keep blob and data urls as is
  // will add more if needed
  // we only want network urls to be fetched and cached
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  const cache = await caches.open(FILE_LOADER_CACHE_PATH);
  const cachedRes = await cache.match(url);
  if (cachedRes) {
    const result = await cachedRes.text();
    // console.warn("ImageLoader: found", url, ": size:", result.length);
    return result;
  }

  const headers = /** @type {Record<String, string>} */ ({});
  if (requireAuth) {
    headers["X-Firebase-Token"] = (await FirebaseAuth.currentUser?.getIdToken()) ?? "";
  }

  // Fetch the image from the URL
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      lang(
        `HTTP error! status: ${response.status}`,
        `এইচ-টি-টি-পি সমস্যা! স্ট্যাটাস: ${response.status}`,
        `एच-टी-टी-पी समस्या! स्टेटस: ${response.status}`
      )
    );
  }

  // Convert the image to a Blob
  const blob = await response.blob();
  // convert blob to a file
  const file = new File([blob], "unknown.bin", { type: blob.type });
  // get the data url of the file
  const result = await fileToDataUrl(file);
  // cache the result
  await cache.put(url, new Response(result, { status: 200 }));

  return result;
}

// Queue to manage pending requests
let fetchQueue = Promise.resolve();

/**
 * Wrapper function that serializes fetchAsDataUrl calls
 * Only one request will execute at a time
 * @param {string} url
 * @param {boolean} [requireAuth]
 * @returns {Promise<string>}
 */
export async function serialFetchAsDataUrl(url, requireAuth = false) {
  // Create a new promise that will resolve with our result
  let resolveOuterPromise;
  const outerPromise = new Promise((resolve) => {
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
        resolveOuterPromise(Promise.reject(error));
      }
    })
    .catch(() => {
      // Catch errors in the queue chain but don't stop the queue
      // This ensures the queue continues processing even if one request fails
    });

  // Return the promise that will resolve when this request is done
  return outerPromise;
}
