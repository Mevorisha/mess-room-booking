import sharp from "sharp";

type ImgWithSz<N> = { img: Buffer; sz: N };

/**
 * Resizes an image to three preset dimensions concurrently.
 *
 * This asynchronous function uses the sharp library to resize the provided image buffer into three fixed sizes:
 * small (30 pixels), medium (90 pixels), and large (500 pixels). It performs the resizing operations concurrently
 * and returns an object with each resized image buffer paired with its corresponding dimension.
 *
 * @param imageBuffer - A buffer containing the image data to be resized.
 * @returns A Promise that resolves to an object with the resized image buffers and their respective dimensions:
 *          - small: Object with the image buffer resized to 30 pixels.
 *          - medium: Object with the image buffer resized to 90 pixels.
 *          - large: Object with the image buffer resized to 500 pixels.
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
 * This asynchronous function uses the Sharp library to resize the input image to the provided target dimension.
 * It returns a promise that resolves with an object containing the resized image buffer as `img` and the target size as `sz`.
 *
 * @param imageBuffer - The buffer containing the original image data.
 * @param n - The target dimension for the resized image.
 * @returns A promise that resolves with an object containing the resized image buffer and its corresponding size.
 */
export async function resizeImageOneSz<N>(imageBuffer: Buffer, n: N): Promise<ImgWithSz<N>> {
  const buffer = await sharp(imageBuffer).resize(n).toBuffer();
  return { img: buffer, sz: n };
}
