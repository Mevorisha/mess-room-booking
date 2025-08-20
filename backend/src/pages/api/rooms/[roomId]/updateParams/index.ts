import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { getLoggedInUser } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { FirebaseStorage, StoragePaths } from "@/firebase/init";
import { RateLimits } from "@/middlewares/RateLimiter";
import { MultiSizePhotoModel } from "@/models/types";
import { ApiResponseUrlType, IdentityType, MultiSizeImageSz, RoomPatchReqBodyDTO } from "sharedtypes";
import { IdentityRepo } from "@/repo/IdentityRepo";
import { RoomRepo } from "@/repo/RoomRepo";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { ImageUploaderService } from "@/services/ImageUploaderService";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

/**
 * Room update API endpoint handler
 *
 * ```
 * request = "PATCH /api/rooms/[roomId]/updateParams" {
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
 *   isUnavailable?: boolean
 *   keepFiles?: Array<string>
 *   addFiles?: Array<{ type: string, name: string, base64: string }>
 * }
 * response = { message: string, imagesUpdated: boolean }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  const { roomId } = RequestValidationParser.parse({
    req,
    method: "PATCH",
    params: z.object({ roomId: CommonZodSchemas.Basic.UID }),
  });

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  const uid = authResult.getUid();

  // Apply rate limiting
  if (!(await RateLimits.ROOM_PARAMS_UPDATE(uid, req, res))) return;

  // Verify user is an OWNER
  const profile = await IdentityRepo.findById(uid, ApiResponseUrlType.GS_PATH, { auth: true });
  if (profile == null) {
    throw CustomApiError.create(404, "User not found");
  }
  if (profile.type !== IdentityType.OWNER) {
    throw CustomApiError.create(403, "Please switch profile type to OWNER before updating a room");
  }

  // Get the existing room details to check ownership and get current images
  const existingRoom = await RoomRepo.findById(roomId, ApiResponseUrlType.GS_PATH);
  if (existingRoom == null) {
    throw CustomApiError.create(404, "Room not found");
  }
  if (existingRoom.ownerId !== uid) {
    throw CustomApiError.create(403, "Only owner can update room");
  }

  // Validate and extract update data
  const bodyResult = RoomPatchReqBodyDTO.BaseParams.fromJson(req.body);
  if (bodyResult.isErr) {
    throw CustomApiError.create(400, "Bad Request", bodyResult.error);
  }
  const { isUnavailable = false, keepFiles = [], addFiles = [], ...updateData } = bodyResult.value;

  // Process existing images
  const { imagesToKeep, imagesToDelete } = getImagesToKeepOrDelete(existingRoom.images, new Set(keepFiles), roomId);

  // Upload new images (if any)
  let newImages: MultiSizePhotoModel[] = [];
  if (addFiles.length > 0) {
    const imageId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    newImages = await ImageUploaderService.upload(addFiles, {
      small: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, MultiSizeImageSz.SMALL),
      medium: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, MultiSizeImageSz.MEDIUM),
      large: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, MultiSizeImageSz.LARGE),
    });
  }

  // Combine kept images with new images
  const finalImages = [...imagesToKeep, ...newImages];

  // Prepare final update data
  const finalUpdateData: typeof updateData & { images?: MultiSizePhotoModel[] } = { ...updateData };

  // Only update images if there were changes
  if (imagesToDelete.length > 0 || addFiles.length > 0) {
    finalUpdateData.images = finalImages;
  }

  // Transaction: Update DB first
  await RoomRepo.update(roomId, finalUpdateData);
  if (isUnavailable) {
    await RoomRepo.setUnavailability(roomId, isUnavailable);
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

/**
 * Process the images to keep and delete based on user request
 */
function getImagesToKeepOrDelete(
  existingImageGsPaths: MultiSizePhotoModel[],
  keepImagesFromAPI: Set<string>,
  roomId: string
): { imagesToKeep: MultiSizePhotoModel[]; imagesToDelete: MultiSizePhotoModel[] } {
  const imagesToKeep: MultiSizePhotoModel[] = [];
  const imagesToDelete: MultiSizePhotoModel[] = [];
  for (const imageGsPath of existingImageGsPaths) {
    // Extract the image ID from the path
    const imageId = StoragePaths.RoomPhotos.getImageIdFromGsPath(imageGsPath.small);
    if (
      keepImagesFromAPI.has(StoragePaths.RoomPhotos.apiUri(roomId, imageId, MultiSizeImageSz.SMALL)) ||
      keepImagesFromAPI.has(StoragePaths.RoomPhotos.apiUri(roomId, imageId, MultiSizeImageSz.MEDIUM)) ||
      keepImagesFromAPI.has(StoragePaths.RoomPhotos.apiUri(roomId, imageId, MultiSizeImageSz.LARGE))
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
 * Delete images that are no longer needed
 */
async function deleteImages(imagesToDelete: MultiSizePhotoModel[]): Promise<void> {
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
