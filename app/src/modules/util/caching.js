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
 * Updates the "last-id" entry in the specified cache.
 *
 * Extracts the numeric identifier from the provided URL by splitting the string on hyphens,
 * reversing the resulting array, and converting the first element to a number. This identifier
 * is then stored as a JSON string under the "last-id" key in the cache.
 *
 * @param {string} cacheName - The name of the cache to update.
 * @param {string} newUrl - The URL containing the new numeric identifier in its last segment.
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
