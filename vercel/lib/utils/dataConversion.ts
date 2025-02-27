import sharp from "sharp";

export async function resizeImage(imageBuffer: Buffer): Promise<{ small: Buffer; medium: Buffer; large: Buffer }> {
  const promises = [
    sharp(imageBuffer).resize(30, 30).toBuffer(),
    sharp(imageBuffer).resize(90, 90).toBuffer(),
    sharp(imageBuffer).resize(500, 500).toBuffer(),
  ];
  const [small, medium, large] = await Promise.all(promises);
  return { small, medium, large };
}
