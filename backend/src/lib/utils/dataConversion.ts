import sharp from "sharp";

export type ImgWithSz<N> = { img: Buffer; sz: N };

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
    small: { img: small as Buffer, sz: 30 },
    medium: { img: medium as Buffer, sz: 90 },
    large: { img: large as Buffer, sz: 500 },
  };
}

export async function resizeImageOneSz<N extends number>(imageBuffer: Buffer, n: N): Promise<ImgWithSz<N>> {
  const buffer = await sharp(imageBuffer).resize(n).toBuffer();
  return { img: buffer, sz: n };
}
