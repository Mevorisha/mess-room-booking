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
 * @param {string} cacheName
 * @param {string} newUrl
 */
export async function putLastCacheUrl(cacheName, newUrl) {
  const lastId = newUrl.split("-")[1];
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
