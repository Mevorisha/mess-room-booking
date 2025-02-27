import sharp from "sharp";

/**
 * Resize an image into multiple sizes.
 * @param {Buffer} imageBuffer - The original image buffer.
 * @returns {Promise<{
 *   image30px: Buffer,
 *   image90px: Buffer,
 *   image500px: Buffer
 * }>} - Resized images in multiple sizes.
 */
export async function resizeImage(imageBuffer) {
  const promises = [
    sharp(imageBuffer).resize(30, 30).toBuffer(),
    sharp(imageBuffer).resize(90, 90).toBuffer(),
    sharp(imageBuffer).resize(500, 500).toBuffer(),
  ];
  const [image30px, image90px, image500px] = await Promise.all(promises);
  return { image30px, image90px, image500px };
}
