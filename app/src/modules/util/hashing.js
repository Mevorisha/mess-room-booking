/**
 * Calculate SHA-256 hash of a Blob
 * @param {Blob} blob - The blob to hash
 * @returns {Promise<string>} - Promise resolving to hex string of the hash
 */
export async function calculateSHA256(blob) {
  // Convert the blob to an ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer();
  // Use the subtle crypto API to calculate the hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  // Convert the hash to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
