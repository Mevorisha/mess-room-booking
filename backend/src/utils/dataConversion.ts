import sharp from "sharp";

export interface ImgWithSz<N> {
  img: Buffer;
  sz: N;
  type: string;
}

export async function resizeImage(
  imageBuffer: Buffer
): Promise<{ small: ImgWithSz<30>; medium: ImgWithSz<90>; large: ImgWithSz<500> }> {
  const promises = [
    // WARNING: resize before encoding, not after
    // NOTE: setting a quality is unncessary but doesn't hurt
    sharp(imageBuffer).resize(30).jpeg({ progressive: true, quality: 90 }).toBuffer(),
    sharp(imageBuffer).resize(90).jpeg({ progressive: true, quality: 90 }).toBuffer(),
    sharp(imageBuffer).resize(500).jpeg({ progressive: true, quality: 90 }).toBuffer(),
  ];
  const [small, medium, large] = await Promise.all(promises);
  return {
    small: { img: small as Buffer, sz: 30, type: "image/jpeg" },
    medium: { img: medium as Buffer, sz: 90, type: "image/jpeg" },
    large: { img: large as Buffer, sz: 500, type: "image/jpeg" },
  };
}

export async function resizeImageOneSz<N extends number>(imageBuffer: Buffer, n: N): Promise<ImgWithSz<N>> {
  // WARNING: resize before encoding, not after
  // NOTE: setting a quality is unncessary but doesn't hurt
  const buffer = await sharp(imageBuffer).resize(n).jpeg({ progressive: true, quality: 90 }).toBuffer();
  return { img: buffer, sz: n, type: "image/jpeg" };
}

export async function convertToJpeg(imageBuffer: Buffer): Promise<ImgWithSz<-1>> {
  const buffer = await sharp(imageBuffer).jpeg({ progressive: true, quality: 90 }).toBuffer();
  return { img: buffer, sz: -1, type: "image/jpeg" };
}
