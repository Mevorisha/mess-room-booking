import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { getLoggedInUser } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { FirebaseStorage, StoragePaths } from "@/firebase/init";
import { resizeImageOneSz } from "@/utils/dataConversion";
import { RateLimits } from "@/middlewares/RateLimiter";
import { MultiSizePhotoModel } from "@/models/types";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { MultiSizeImageSz, RoomPhotoUploadDTO, RoomPostReqBodyDTO } from "sharedtypes";
import { IdentityRepo } from "@/repo/IdentityRepo";
import { ApiResponseUrlType, IdentityType } from "sharedtypes/dist/types/typeEnums";
import { RoomRepo } from "@/repo/RoomRepo";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

/**
 * Validates image file types and performs additional security checks
 */
function validateImageFile(file: RoomPhotoUploadDTO): void {
  if (!/^image\/(jpeg|png|jpg)$/.test(file.type)) {
    throw CustomApiError.create(400, `Invalid file type '${file.type}'. Only jpeg, png and jpg are allowed.`);
  }
  // Additional validation for base64 data
  const base64Data = file.base64;
  if (base64Data.length === 0 || base64Data.length < 100) {
    // Very basic check - empty or too small to be real image
    throw CustomApiError.create(400, "Invalid image data");
  }
  // Could add more sophisticated validation here (check image dimensions, file signatures, etc.)
}

/**
 * Upload new images in parallel batches to optimize performance
 */
async function uploadRoomImages(files: RoomPhotoUploadDTO[], roomId: string): Promise<MultiSizePhotoModel[]> {
  const bucket = FirebaseStorage.bucket();
  const imagePaths: MultiSizePhotoModel[] = [];

  // Process 3 images at a time to avoid memory issues
  const BATCH_SIZE = 3;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (file) => {
      // Validate each file before processing
      validateImageFile(file);
      const { type, base64 } = file;
      // Convert from b64 and resize images for different sizes
      const largeImgBuff = Buffer.from(base64, "base64");
      const mediumImgBuff = (await resizeImageOneSz<200>(largeImgBuff, 200)).img;
      const smallImgBuff = (await resizeImageOneSz<70>(largeImgBuff, 70)).img;
      // Generate unique image ID
      const imageId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      // Create file paths
      const filePaths = {
        small: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, MultiSizeImageSz.SMALL),
        medium: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, MultiSizeImageSz.MEDIUM),
        large: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, MultiSizeImageSz.LARGE),
      };
      // Upload all sizes for this image
      await Promise.all([
        bucket.file(filePaths.small).save(smallImgBuff, { contentType: type }),
        bucket.file(filePaths.medium).save(mediumImgBuff, { contentType: type }),
        bucket.file(filePaths.large).save(largeImgBuff, { contentType: type }),
      ]);
      return filePaths;
    });
    // Process each batch sequentially to avoid memory issues
    const batchResults = await Promise.all(batchPromises);
    imagePaths.push(...batchResults);
  }
  return imagePaths;
}

/**
 * Room creation API endpoint handler
 *
 * ```
 * request = "POST /api/rooms/create" {
 *   acceptGender: "MALE" | "FEMALE" | "OTHER"
 *   acceptOccupation: "STUDENT" | "PROFESSIONAL" | "ANY"
 *   searchTags: Set<string>
 *   landmark: string
 *   address: string
 *   city: string
 *   state: string
 *   majorTags: Set<string>
 *   minorTags: Set<string>
 *   capacity: number
 *   pricePerOccupant: number
 *   files: Array<{ type: string, name: string, base64: string }>
 * }
 * response = { roomId: string }
 * ```
 */
export default WithMiddleware(async function POST(req: NextApiRequest, res: NextApiResponse) {
  RequestValidationParser.parse({
    req,
    method: "POST",
  });

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);

  // Automatically throws ApiError and is caught by catchAll (middleware)
  const uid = authResult.getUid();

  // Apply rate limiting
  if (!(await RateLimits.ROOM_CREATE(uid, req, res))) return;

  // Verify user is an OWNER
  const profile = await IdentityRepo.findById(uid, ApiResponseUrlType.GS_PATH, { auth: true });
  if (profile == null) {
    throw CustomApiError.create(404, "User not found");
  }
  if (profile.type !== IdentityType.OWNER) {
    throw CustomApiError.create(403, "Please switch profile type to OWNER before creating a room");
  }

  // Set owner ID and validate input data
  const postResult = RoomPostReqBodyDTO.fromJson({ ownerId: uid, ...req.body });
  if (postResult.isErr) {
    throw CustomApiError.create(400, "Bad Request", postResult.error);
  }
  const files = postResult.value.getFiles();

  // Create the room in the database first
  const roomId = await RoomRepo.create(postResult.value.omitFiles());

  // Process and upload images if any
  if (files.length > 0) {
    try {
      // Upload all images and get their paths
      const imagePaths = await uploadRoomImages(files, roomId);
      // Update the room with image paths
      await RoomRepo.update(roomId, { images: imagePaths });
    } catch (e) {
      // If image upload fails, still return success but log the error
      console.error("Error uploading room images:", e);
      return respond(res, {
        status: 201,
        json: {
          roomId,
          error: "Room created but there was an issue with image uploads. Please try updating images later.",
        },
      });
    }
  }

  return respond(res, { status: 201, json: { roomId } });
});
