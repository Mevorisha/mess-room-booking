import sharp from "sharp";

type ImgWithSz<N> = { img: Buffer; sz: N };

/**
 * Asynchronously resizes an image buffer to three fixed sizes.
 *
 * This function concurrently resizes the provided image buffer into three dimensions:
 * 30 pixels (small), 90 pixels (medium), and 500 pixels (large). It uses the sharp library
 * to perform the resizing operations in parallel and returns an object containing each resized image along with its size.
 *
 * @param imageBuffer - The original image buffer to be resized.
 * @returns A promise that resolves to an object with the resized images:
 * - small: Image resized to 30 pixels.
 * - medium: Image resized to 90 pixels.
 * - large: Image resized to 500 pixels.
 */
export async function resizeImage(
  imageBuffer: Buffer
): Promise<{ small: ImgWithSz<30>; medium: ImgWithSz<90>; large: ImgWithSz<500> }> {
  const promises = [
    sharp(imageBuffer).resize(30).toBuffer(),
    sharp(imageBuffer).resize(90).toBuffer(),
    sharp(imageBuffer).resize(500).toBuffer(),
  ];
  const [small, medium, large] = await Promise.all(promises);
  return {
    small: { img: small, sz: 30 },
    medium: { img: medium, sz: 90 },
    large: { img: large, sz: 500 },
  };
}

/**
 * Resizes an image buffer to a specified size.
 *
 * This asynchronous function uses the `sharp` library to resize the given image buffer to the target size,
 * then converts the result into a Buffer. It returns an object containing the resized image (`img`) and the
 * size used for resizing (`sz`).
 *
 * @param imageBuffer - The image data as a Buffer.
 * @param n - The target size for the resized image.
 * @returns A promise that resolves to an object containing the resized image buffer and the target size.
 */
export async function resizeImageOneSz<N>(imageBuffer: Buffer, n: N): Promise<ImgWithSz<N>> {
  const buffer = await sharp(imageBuffer).resize(n).toBuffer();
  return { img: buffer, sz: n };
}
