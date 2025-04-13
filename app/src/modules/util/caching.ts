export enum CachePaths {
  FILE_LOADER = "custom-FileLoader-cache-v1",
  SECTION_ROOM_FORM = "custom-SectionRoomForm-cache-v1",
}

export async function createNewCacheUrl(cacheName: string): Promise<string> {
  const lastId = (await caches
    .open(cacheName)
    .then((cache) => cache.match("last-id"))
    .then((lastId) => (lastId != null ? lastId.json() : 0))) as number;
  return `draft-${lastId + 1}`;
}

export async function putLastCacheUrl(cacheName: string, newUrl: string): Promise<void> {
  const lastId = Number(newUrl.split("-").reverse()[0]);
  const cache = await caches.open(cacheName);
  await cache.put("last-id", new Response(JSON.stringify(lastId), { status: 200 }));
}

export async function getAllCacheUrls(cacheName: string): Promise<string[]> {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  return keys.map((key) => key.url);
}
