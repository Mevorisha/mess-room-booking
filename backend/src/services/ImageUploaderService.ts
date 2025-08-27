import { FirebaseStorage } from "@/firebase/init";
import { MultiSizePhotoModel } from "@/models/types";
import { ImageUploadData } from "@/parsers/RequestImageBodyParser";
import { CustomApiError } from "@/types/CustomApiError";
import { resizeImage, resizeImageOneSz } from "@/utils/dataConversion";
import { Base64PhotoUploadDTO } from "sharedtypes";

export interface UploadTargets {
  small: string;
  medium: string;
  large: string;
}

export class ImageUploaderService {
  static createRandomId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  static async upload(file: ImageUploadData, targets: UploadTargets): Promise<MultiSizePhotoModel>;
  static async upload(files: Base64PhotoUploadDTO[], targets: UploadTargets): Promise<MultiSizePhotoModel[]>;

  static async upload(
    files: ImageUploadData | Base64PhotoUploadDTO[],
    targets: UploadTargets
  ): Promise<MultiSizePhotoModel | MultiSizePhotoModel[]> {
    if (Array.isArray(files)) {
      return ImageUploaderService.uploadB64(files, targets);
    } else {
      return ImageUploaderService.uploadStd(files, targets);
    }
  }

  protected static async uploadStd(file: ImageUploadData, targets: UploadTargets): Promise<MultiSizePhotoModel> {
    const bucket = FirebaseStorage.bucket();
    const resizedImages = await resizeImage(file.buffer);
    await Promise.all([
      bucket.file(targets.small).save(resizedImages.small.img, { contentType: "image/jpeg" }),
      bucket.file(targets.medium).save(resizedImages.medium.img, { contentType: "image/jpeg" }),
      bucket.file(targets.large).save(resizedImages.large.img, { contentType: "image/jpeg" }),
    ]);
    return targets;
  }

  protected static async uploadB64(
    files: Base64PhotoUploadDTO[],
    targets: UploadTargets
  ): Promise<MultiSizePhotoModel[]> {
    const bucket = FirebaseStorage.bucket();
    const imagePaths: MultiSizePhotoModel[] = [];

    // Process 3 images at a time to avoid memory issues
    const BATCH_SIZE = 3;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (file) => {
        // Validate each file before processing
        ImageUploaderService.validateImageFile(file);
        const { base64 } = file;
        // Convert from b64 and resize images for different sizes
        const largeImgBuff = Buffer.from(base64, "base64");
        const mediumImgBuff = (await resizeImageOneSz<200>(largeImgBuff, 200)).img;
        const smallImgBuff = (await resizeImageOneSz<70>(largeImgBuff, 70)).img;
        // Upload all sizes for this image
        await Promise.all([
          // always save jpeg for consistency and security
          bucket.file(targets.small).save(smallImgBuff, { contentType: "image/jpeg" }),
          bucket.file(targets.medium).save(mediumImgBuff, { contentType: "image/jpeg" }),
          bucket.file(targets.large).save(largeImgBuff, { contentType: "image/jpeg" }),
        ]);
        return targets;
      });
      // Process each batch sequentially to avoid memory issues
      const batchResults = await Promise.all(batchPromises);
      imagePaths.push(...batchResults);
    }
    return imagePaths;
  }

  /**
   * Validates image file types and performs additional security checks
   */
  protected static validateImageFile(file: Base64PhotoUploadDTO): void {
    if (!/^image\/(jpeg|png|jpg)$/.test(file.type)) {
      throw CustomApiError.create(400, `Invalid file type '${file.type}'. Only jpeg, png and jpg are allowed.`);
    }
    // Additional validation for base64 data
    const base64Data = file.base64;
    if (base64Data.length < 100) {
      // Very basic check - empty or too small to be real image
      throw CustomApiError.create(400, "Invalid image data");
    }
    // Could add more sophisticated validation here (check image dimensions, file signatures, etc.)
  }
}
