import { FirebaseStorage } from "@/firebase/init";
import { MultiSizePhotoModel } from "@/models/types";
import { ImageUploadData } from "@/parsers/RequestImageBodyParser";
import { CustomApiError } from "@/types/CustomApiError";
import { resizeImage, resizeImageOneSz } from "@/utils/dataConversion";
import { Base64PhotoUploadDTO, MultipleErrors } from "sharedtypes";

export interface UploadTarget extends MultiSizePhotoModel {
  small: string;
  medium: string;
  large: string;
}

export class ImageUploaderService {
  static createRandomId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  static async upload(file: ImageUploadData, target: UploadTarget): Promise<MultiSizePhotoModel>;

  /**
   * @param {{ file: Base64PhotoUploadDTO; target: UploadTarget }[]} files Files and targets (paths) to upload to
   * @returns {Promise<MultiSizePhotoModel[]>} Paths to only those images that were successfully uploaded
   */
  static async upload(files: { file: Base64PhotoUploadDTO; target: UploadTarget }[]): Promise<MultiSizePhotoModel[]>;

  static async upload(
    files: ImageUploadData | { file: Base64PhotoUploadDTO; target: UploadTarget }[],
    target?: UploadTarget
  ): Promise<MultiSizePhotoModel | MultiSizePhotoModel[]> {
    if (Array.isArray(files)) {
      return ImageUploaderService.uploadB64(files);
    } else if (target != null) {
      return ImageUploaderService.uploadStd(files, target);
    } else {
      throw new Error("Incorrect function usage");
    }
  }

  protected static async uploadStd(file: ImageUploadData, targets: UploadTarget): Promise<MultiSizePhotoModel> {
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
    files: {
      file: Base64PhotoUploadDTO;
      target: UploadTarget;
    }[]
  ): Promise<MultiSizePhotoModel[]> {
    const bucket = FirebaseStorage.bucket();
    const imagePaths: MultiSizePhotoModel[] = [];
    const hallOfFailures: unknown[] = [];

    // Process 3 images at a time to avoid memory issues
    const BATCH_SIZE = 3;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const batchUploadPromises = batch.map(async ({ file, target }) => {
        // Validate each file before processing
        ImageUploaderService.validateImageFile(file);
        const { base64 } = file;
        // Convert from b64 and resize images for different sizes
        const largeImgBuff = Buffer.from(base64, "base64");
        const mediumImgBuff = (await resizeImageOneSz<200>(largeImgBuff, 200)).img;
        const smallImgBuff = (await resizeImageOneSz<70>(largeImgBuff, 70)).img;
        // Upload all sizes for this image; Fail this image target if one size fails
        await Promise.all([
          // always save jpeg for consistency and security
          bucket.file(target.small).save(smallImgBuff, { contentType: "image/jpeg" }),
          bucket.file(target.medium).save(mediumImgBuff, { contentType: "image/jpeg" }),
          bucket.file(target.large).save(largeImgBuff, { contentType: "image/jpeg" }),
        ]);
        return target;
      });
      // Process each batch sequentially to avoid memory issues
      const batchResults = await Promise.allSettled(batchUploadPromises);
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          imagePaths.push(result.value);
        } else {
          hallOfFailures.push(result.reason);
        }
      }
    }

    if (imagePaths.length === 0) {
      // throw if all failed else suceed partially
      throw CustomApiError.create(500, "All image uploads failed", hallOfFailures);
    }
    // why using else: coz printing CustomApiError will print the hallOfFailures anyway so no need to print it again below
    else if (hallOfFailures.length > 0) {
      // print failures
      console.error("[E] [ImageUploaderService] Some uploads failed:");
      console.error(new MultipleErrors(hallOfFailures));
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
