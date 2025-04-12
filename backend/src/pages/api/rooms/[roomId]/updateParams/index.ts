import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { getLoggedInUser } from "@/middlewares/auth";
import Identity, { SchemaFields as IdentitySchemaFields } from "@/models/Identity";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";
import Room, { SchemaFields as RoomSchemaFields, RoomUpdateData } from "@/models/Room";
import Joi from "joi";
import { FirebaseStorage, StoragePaths } from "@/lib/firebaseAdmin/init";
import { resizeImageOneSz } from "@/lib/utils/dataConversion";
import { RateLimits } from "@/middlewares/rateLimit";
import { MultiSizePhoto } from "@/models/Identity";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

/**
 * Validates room update input data
 * @throws {CustomApiError} On joi validation failure
 */
function validateRoomUpdateData(req: NextApiRequest): {
  isUnavailable: boolean | undefined;
  updateData: RoomUpdateData;
  keepFiles: Set<string>;
  addFiles: Array<{ type: string; name: string; base64: string }>;
} {
  const roomUpdateSchema = Joi.object({
    isUnavailable: Joi.boolean(),
    acceptOccupation: Joi.string().valid("STUDENT", "PROFESSIONAL", "ANY"),
    searchTags: Joi.array().items(Joi.string().trim()),
    landmark: Joi.string().trim(),
    address: Joi.string().trim(),
    city: Joi.string().trim(),
    state: Joi.string().trim(),
    majorTags: Joi.array().items(Joi.string().trim()),
    minorTags: Joi.array().items(Joi.string().trim()),
    capacity: Joi.number().integer().positive(),
    pricePerOccupant: Joi.number().positive(),
    keepFiles: Joi.array().items(Joi.string().trim()).default([]),
    addFiles: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().required(),
          name: Joi.string().required(),
          base64: Joi.string()
            .pattern(/^[A-Za-z0-9+/=]+$/)
            .required(),
        })
      )
      .default([]),
  });
  // Ensure at least one valid update field is provided (not just metadata fields)
  const updateFields = [
    "acceptOccupation",
    "searchTags",
    "landmark",
    "address",
    "city",
    "state",
    "majorTags",
    "minorTags",
    "capacity",
    "pricePerOccupant",
    "isUnavailable",
  ];
  const hasUpdateField = updateFields.some((field) => req.body[field] !== undefined);
  const hasFileChanges =
    (req.body.keepFiles && req.body.keepFiles.length > 0) || (req.body.addFiles && req.body.addFiles.length > 0);
  if (!hasUpdateField && !hasFileChanges) {
    throw CustomApiError.create(400, "At least one field must be provided for update");
  }
  const { error, value } = roomUpdateSchema.validate(req.body);
  if (error) {
    throw CustomApiError.create(400, `Validation error: ${error.message}`);
  }
  // Extract the fields to update
  const keepFiles: Set<string> = new Set(value.keepFiles || []);
  const addFiles: Array<{ type: string; name: string; base64: string }> = value.addFiles || [];
  const isUnavailable: boolean | undefined = value.isUnavailable !== void 0 ? Boolean(value.isUnavailable) : void 0;
  const updateData = { ...value };
  // Remove non-update fields
  delete updateData.keepFiles;
  delete updateData.addFiles;
  delete updateData.isUnavailable;
  // Convert arrays to sets if they exist
  if (updateData.searchTags) updateData.searchTags = new Set(updateData.searchTags);
  if (updateData.majorTags) updateData.majorTags = new Set(updateData.majorTags);
  if (updateData.minorTags) updateData.minorTags = new Set(updateData.minorTags);
  // Make sure rating is not being added (security check)
  if ("rating" in updateData) {
    delete updateData.rating;
  }
  return { isUnavailable, updateData, keepFiles, addFiles };
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
 * Process the images to keep and delete based on user request
 */
function processExistingImages(
  existingImageGsPaths: MultiSizePhoto[],
  keepFiles: Set<string>,
  roomId: string
): { imagesToKeep: MultiSizePhoto[]; imagesToDelete: MultiSizePhoto[] } {
  const imagesToKeep: MultiSizePhoto[] = [];
  const imagesToDelete: MultiSizePhoto[] = [];
  for (const imageGsPath of existingImageGsPaths) {
    // Extract the image ID from the path
    const imageId = StoragePaths.RoomPhotos.getImageIdFromGsPath(imageGsPath.small);
    if (
      keepFiles.has(StoragePaths.RoomPhotos.apiUri(roomId, imageId, "small")) ||
      keepFiles.has(StoragePaths.RoomPhotos.apiUri(roomId, imageId, "medium")) ||
      keepFiles.has(StoragePaths.RoomPhotos.apiUri(roomId, imageId, "large"))
    ) {
      // Keep this image in the update list
      imagesToKeep.push(imageGsPath);
    } else {
      // Mark for deletion
      imagesToDelete.push(imageGsPath);
    }
  }
  return { imagesToKeep, imagesToDelete };
}

/**
 * Upload new images in parallel batches to optimize performance
 */
async function uploadNewImages(
  addFiles: Array<{ type: string; name: string; base64: string }>,
  roomId: string
): Promise<MultiSizePhoto[]> {
  const bucket = FirebaseStorage.bucket();
  const newImages: MultiSizePhoto[] = [];

  // Process 3 images at a time to avoid memory issues
  const BATCH_SIZE = 3;

  for (let i = 0; i < addFiles.length; i += BATCH_SIZE) {
    const batch = addFiles.slice(i, i + BATCH_SIZE);
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
    newImages.push(...batchResults);
  }
  return newImages;
}

/**
 * Delete images that are no longer needed
 */
async function deleteImages(imagesToDelete: MultiSizePhoto[]): Promise<void> {
  const bucket = FirebaseStorage.bucket();
  const deletePromises: Promise<unknown>[] = [];
  for (const image of imagesToDelete) {
    deletePromises.push(
      bucket.file(image.small).delete(),
      bucket.file(image.medium).delete(),
      bucket.file(image.large).delete()
    );
  }
  await Promise.all(deletePromises);
}

/**
 * Room update API endpoint handler
 *
 * ```
 * request = "PATCH /api/rooms/[roomId]/updateParams" {
 *   isUnavailable?: boolean
 *   acceptOccupation?: "STUDENT" | "PROFESSIONAL" | "ANY"
 *   searchTags?: Array<string>
 *   landmark?: string
 *   address?: string
 *   city?: string
 *   state?: string
 *   majorTags?: Array<string>
 *   minorTags?: Array<string>
 *   capacity?: number
 *   pricePerOccupant?: number
 *   keepFiles?: Array<string>
 *   addFiles?: Array<{ type: string, name: string, base64: string }>
 * }
 * response = { message: string, imagesUpdated: boolean }
 * ```
 */
export default withmiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  const roomId = req.query["roomId"] as string;
  if (!roomId) {
    throw CustomApiError.create(400, "Missing field 'roomId: string'");
  }

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  const uid = authResult.getUid();

  // Apply rate limiting
  if (!(await RateLimits.ROOM_PARAMS_UPDATE(uid, req, res))) return;

  // Verify user is an OWNER
  const profile = await Identity.get(uid, "GS_PATH", [IdentitySchemaFields.TYPE]);
  if (!profile) {
    throw CustomApiError.create(404, "User not found");
  }
  if (profile.type !== "OWNER") {
    throw CustomApiError.create(403, "Please switch profile type to OWNER before updating a room");
  }

  // Get the existing room details to check ownership and get current images
  const existingRoom = await Room.get(roomId, "GS_PATH", [RoomSchemaFields.OWNER_ID, RoomSchemaFields.IMAGES]);
  if (!existingRoom) {
    throw CustomApiError.create(404, "Room not found");
  }
  if (existingRoom.ownerId !== uid) {
    throw CustomApiError.create(403, "Only owner can update room");
  }

  // Validate and extract update data
  const { isUnavailable, updateData, keepFiles, addFiles } = validateRoomUpdateData(req);

  // Process existing images
  const existingImageGsPaths = existingRoom.images || [];
  const { imagesToKeep, imagesToDelete } = processExistingImages(existingImageGsPaths, keepFiles, roomId);

  // Upload new images (if any)
  let newImages: MultiSizePhoto[] = [];
  if (addFiles.length > 0) {
    newImages = await uploadNewImages(addFiles, roomId);
  }

  // Combine kept images with new images
  const finalImages = [...imagesToKeep, ...newImages];

  // Prepare final update data
  const finalUpdateData: RoomUpdateData = { ...updateData };

  // Only update images if there were changes
  if (imagesToDelete.length > 0 || addFiles.length > 0) {
    finalUpdateData.images = finalImages;
  }

  // Transaction: Update DB first
  await Room.update(roomId, finalUpdateData);
  if (typeof isUnavailable === "boolean") {
    await Room.setUnavailability(roomId, isUnavailable);
  }

  // Only delete images after successful DB update
  await deleteImages(imagesToDelete);

  return respond(res, {
    status: 200,
    json: {
      message: "Room updated successfully",
      imagesUpdated: imagesToDelete.length > 0 || addFiles.length > 0,
    },
  });
});
