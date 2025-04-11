import { NextApiRequest, NextApiResponse } from "next";
import Room from "@/models/Room";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { StoragePaths } from "@/lib/firebaseAdmin/init";
import { gsPathToUrl } from "@/models/utils";
import { CustomApiError } from "@/lib/utils/ApiError";

/**
 * ```
 * request = "GET /api/rooms/[roomId]/[imageIdOrUid]/readImage"
 * response = "Content-Type: image/(jpeg|png)"
 * ```
 */
export default withmiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET method
  if (req.method !== "GET") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  // Extract room ID and image ID from request
  const roomId = req.query["roomId"] as string;
  const imageId = req.query["imageIdOrUid"] as string;

  if (!roomId) {
    throw CustomApiError.create(400, "Missing field 'roomId: string'");
  }

  if (!imageId) {
    throw CustomApiError.create(400, "Missing field 'imageIdOrUid: string'");
  }

  // Build the GS path for the requested room image
  const gsPath = StoragePaths.RoomPhotos.gsBucket(roomId, imageId);

  // Get image direct URL
  const directUrl = await gsPathToUrl(gsPath);

  // Fetch the image
  const response = await fetch(directUrl);
  if (!response.ok) {
    throw CustomApiError.create(404, "Image not found");
  }

  // Get content type and binary data
  const contentType = response.headers.get("content-type");
  const imageBuffer = await response.arrayBuffer();

  // Send the image
  res.setHeader("Content-Type", contentType || "application/octet-stream");
  res.send(Buffer.from(imageBuffer));
});
