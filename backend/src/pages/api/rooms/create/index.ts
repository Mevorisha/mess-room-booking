import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { getLoggedInUser } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { StoragePaths } from "@/firebase/init";
import { RateLimits } from "@/middlewares/RateLimiter";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import {
  MultiSizeImageSz,
  RoomPostReqBodyDTO,
  ApiResponseUrlType,
  IdentityType,
  HttpMethodTypes,
  Base64PhotoUploadDTO,
} from "sharedtypes";
import { IdentityRepo } from "@/repo/IdentityRepo";
import { RoomRepo } from "@/repo/RoomRepo";
import { ImageUploaderService, UploadTarget } from "@/services/ImageUploaderService";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

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
  RequestValidationParser.parse({ req, method: HttpMethodTypes.POST });

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
  const postResult = RoomPostReqBodyDTO.WithFiles.fromJson({ ownerId: uid, ...req.body });
  if (postResult.isErr) {
    throw CustomApiError.create(400, "Bad Request", postResult.error);
  }
  const files = postResult.value.getFiles();

  // Create the room in the database first
  const roomId = await RoomRepo.create(postResult.value.omitFiles());

  if (files.length === 0) {
    return respond(res, { status: 201, json: { roomId } });
  }

  // Process and upload images if any
  const uploadEntries: { file: Base64PhotoUploadDTO; target: UploadTarget }[] = [];
  for (const file of files) {
    const imageId = ImageUploaderService.createRandomId();
    uploadEntries.push({
      file,
      target: {
        small: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, MultiSizeImageSz.SMALL),
        medium: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, MultiSizeImageSz.MEDIUM),
        large: StoragePaths.RoomPhotos.gsBucket(roomId, imageId, MultiSizeImageSz.LARGE),
      },
    });
  }
  // Upload all images and get their paths
  const imagePaths = await ImageUploaderService.upload(uploadEntries);

  const allUploadsSucceeded = imagePaths.length === uploadEntries.length;

  // Update the room with image paths
  await RoomRepo.update(roomId, { images: imagePaths });

  if (!allUploadsSucceeded) {
    return respond(res, {
      status: 500,
      json: { message: "Some image uploads failed", imagesAdded: imagePaths.length },
    });
  } else {
    return respond(res, { status: 201, json: { roomId, imagesAdded: imagePaths.length } });
  }
});
