/**
 * @param {Blob} blob
 * @param {string} [additonalTracking]
 * @return {string}
 */
export function urlObjectCreateWrapper(blob, additonalTracking) {
  const url = URL.createObjectURL(blob);
  // console.trace("Created", url, additonalTracking);
  return url;
}

/**
 * @param {string} url
 * @param {string} [additonalTracking]
 */
export function urlObjectRevokeWrapper(url, additonalTracking) {
  // console.trace("Revoked", url, additonalTracking);
  URL.revokeObjectURL(url);
}
