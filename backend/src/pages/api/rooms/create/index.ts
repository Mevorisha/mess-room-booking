import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { getLoggedInUser } from "@/middlewares/Auth";
import Identity, { SchemaFields } from "@/models/Identity";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import Room, { RoomCreateData } from "@/models/Room";
import Joi from "joi";
import { FirebaseStorage, StoragePaths } from "@/firebase/init";
import { resizeImageOneSz } from "@/utils/dataConversion";
import { RateLimits } from "@/middlewares/RateLimiter";
import { MultiSizePhoto } from "@/models/types";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

/**
 * Validates room creation input data
 * @throws {CustomApiError} On joi validation failure
 */
function validateRoomCreateData(req: NextApiRequest): {
  roomCreateData: RoomCreateData;
  files: Array<{ type: string; name: string; base64: string }>;
} {
  const roomCreateSchema = Joi.object({
    ownerId: Joi.string().trim().required(),
    acceptGender: Joi.string().valid("MALE", "FEMALE", "OTHER").required(),
    acceptOccupation: Joi.string().valid("STUDENT", "PROFESSIONAL", "ANY").required(),
    searchTags: Joi.array().items(Joi.string().trim().required()).required(),
    landmark: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    majorTags: Joi.array().items(Joi.string().trim().required()).required(),
    minorTags: Joi.array().items(Joi.string().trim()).min(0).required(),
    capacity: Joi.number().integer().positive().required(),
    pricePerOccupant: Joi.number().positive().required(),
    files: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().required(),
          name: Joi.string().required(),
          base64: Joi.string()
            .pattern(/^[A-Za-z0-9+/=]+$/)
            .required(),
        })
      )
      .min(0)
      .required(),
  });

  const { error, value } = roomCreateSchema.validate(req.body);

  if (error) {
    throw CustomApiError.create(400, `Validation error: ${error.message}`);
  }

  const roomCreateData = {
    ...value,
    searchTags: new Set(value.searchTags),
    majorTags: new Set(value.majorTags),
    minorTags: new Set(value.minorTags),
  };

  delete roomCreateData.files;

  return { roomCreateData, files: value.files };
}

/**
 * Validates image file types and performs additional security checks
 */
function validateImageFile(file: { type: string; base64: string }): void {
  if (!/^image\/(jpeg|png|jpg)$/.test(file.type)) {
    throw CustomApiError.create(400, `Invalid file type '${file.type}'. Only jpeg, png and jpg are allowed.`);
  }
  // Additional validation for base64 data
  const base64Data = file.base64;
  if (!base64Data || base64Data.length < 100) {
    // Very basic check - empty or too small to be real image
    throw CustomApiError.create(400, "Invalid image data");
  }
  // Could add more sophisticated validation here (check image dimensions, file signatures, etc.)
}

/**
 * Upload new images in parallel batches to optimize performance
 */
async function uploadRoomImages(
  files: Array<{ type: string; name: string; base64: string }>,
  roomId: string
): Promise<MultiSizePhoto[]> {
  const bucket = FirebaseStorage.bucket();
  const imagePaths: MultiSizePhoto[] = [];

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
        small: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, "small"),
        medium: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, "medium"),
        large: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, "large"),
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
  // Only allow POST method
  if (req.method !== "POST") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  const uid = authResult.getUid();

  // Apply rate limiting
  if (!(await RateLimits.ROOM_CREATE(uid, req, res))) return;

  // Verify user is an OWNER
  const profile = await Identity.get(uid, "GS_PATH", [SchemaFields.TYPE]);
  if (!profile) {
    throw CustomApiError.create(404, "User not found");
  }
  if (profile.type !== "OWNER") {
    throw CustomApiError.create(403, "Please switch profile type to OWNER before creating a room");
  }

  // Set owner ID and validate input data
  req.body.ownerId = uid;
  const { roomCreateData, files } = validateRoomCreateData(req);

  // Create the room in the database first
  const roomId = await Room.create(roomCreateData);

  // Process and upload images if any
  if (files.length > 0) {
    try {
      // Upload all images and get their paths
      const imagePaths = await uploadRoomImages(files, roomId);
      // Update the room with image paths
      await Room.update(roomId, { images: imagePaths });
    } catch (error) {
      // If image upload fails, still return success but log the error
      console.error("Error uploading room images:", error);
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
