export const CachePaths = {
  IMAGE_LOADER: "custom-ImageLoader-cache-v1",
  SECTION_ROOM_FORM: "custom-SectionRoomForm-cache-v1",
};

/**
 * @param {string} cacheName
 * @returns {Promise<string>}
 */
export async function createNewCacheUrl(cacheName) {
  const lastId = await caches
    .open(cacheName)
    .then((cache) => cache.match("last-id"))
    .then((lastId) => (lastId ? lastId.json() : 0));
  return `draft-${lastId + 1}`;
}

/**
 * Updates the stored "last-id" in the specified cache using a numeric identifier extracted from a URL.
 *
 * The function extracts the identifier by splitting the provided URL by hyphens, reversing the resulting array,
 * and converting the last element to a number. It then opens the cache with the given name and stores the identifier
 * as a JSON string under the key "last-id".
 *
 * @param {string} cacheName - The name of the cache to update.
 * @param {string} newUrl - The URL from which to extract the numeric identifier.
 */
export async function putLastCacheUrl(cacheName, newUrl) {
  const lastId = Number(newUrl.split("-").reverse()[0]);
  const cache = await caches.open(cacheName);
  await cache.put("last-id", new Response(JSON.stringify(lastId), { status: 200 }));
}

/**
 * @param {string} cacheName
 * @returns {Promise<string[]>}
 */
export async function getAllCacheUrls(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  return keys.map((key) => key.url);
}
