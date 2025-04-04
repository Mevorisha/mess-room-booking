import sharp from "sharp";

type ImgWithSz<N> = { img: Buffer; sz: N };

/**
 * Resizes an image concurrently to three predetermined sizes (30, 90, and 500 pixels).
 *
 * The function uses the sharp library to resize the input image to each of the three fixed dimensions concurrently.
 * It returns a Promise that resolves to an object containing three properties—`small`, `medium`, and `large`—each holding the resized image buffer alongside its target size.
 *
 * @param imageBuffer - The Buffer containing the image data to be resized.
 * @returns A Promise that resolves to an object with the resized image buffers and their corresponding sizes.
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
 * This function uses the sharp library to resize the given image buffer to the target size and returns a promise
 * that resolves to an object containing the resized image buffer and the specified size.
 *
 * @param imageBuffer - A Buffer containing the original image data.
 * @param n - The target size for resizing the image.
 * @returns A promise that resolves with an object containing the resized image buffer as `img` and the target size as `sz`.
 */
export async function resizeImageOneSz<N>(imageBuffer: Buffer, n: N): Promise<ImgWithSz<N>> {
  const buffer = await sharp(imageBuffer).resize(n).toBuffer();
  return { img: buffer, sz: n };
}
