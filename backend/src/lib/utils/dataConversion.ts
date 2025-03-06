import sharp from "sharp";

type ImgWithSz<N> = { img: Buffer; sz: N };

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
