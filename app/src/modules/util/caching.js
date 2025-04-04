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
 * Updates the cache's "last-id" entry with a numeric identifier extracted from the provided URL.
 *
 * This function extracts the identifier by splitting the URL on hyphens, reversing the resulting array,
 * and converting the first element (originally the last segment) to a number. It then opens the specified cache
 * and stores the identifier as a JSON-encoded value under the "last-id" key.
 *
 * @param {string} cacheName - The name of the cache to update.
 * @param {string} newUrl - The URL containing the numeric identifier in its last segment.
 * @returns {Promise<void>} A promise that resolves once the cache update operation is complete.
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
