import { NextApiRequest, NextApiResponse } from "next";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { MultiSizeImageSz, StoragePaths } from "@/lib/firebaseAdmin/init";
import { gsPathToUrl } from "@/models/utils";
import { CustomApiError } from "@/lib/utils/ApiError";
import { RateLimits } from "@/middlewares/rateLimit";
import HeaderTypes from "@/lib/utils/HeaderTypes";

/**
 * ```
 * request = "GET /api/rooms/[roomId]/[imageIdOrUid]/readImage?size=(small|medium|large)&b64=boolean"
 * response = "Content-Type: image/(jpeg|png)"
 * ```
 */
export default withmiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (!(await RateLimits.ROOM_IMAGE_READ(req, res))) return;

  // Only allow GET method
  if (req.method !== "GET") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  // Extract room ID and image ID from request
  const roomId = req.query["roomId"] as string;
  const imageId = req.query["imageIdOrUid"] as string;
  const size = req.query["size"] as MultiSizeImageSz;
  const b64 = req.query["b64"] === "true" ? true : false;

  if (!roomId) {
    throw CustomApiError.create(400, "Missing field 'roomId: string'");
  }

  if (!imageId) {
    throw CustomApiError.create(400, "Missing field 'imageIdOrUid: string'");
  }

  if (!size) {
    throw CustomApiError.create(400, "Missing field 'size: small | medium | large'");
  }
  if (!["small", "medium", "large"].includes(size)) {
    throw CustomApiError.create(400, "Invalid field 'size: small | medium | large'");
  }

  // Build the GS path for the requested room image
  const gsPath = StoragePaths.RoomPhotos.gsBucket(roomId, imageId, size);

  // Get image direct URL
  const directUrl = await gsPathToUrl(gsPath);

  // Fetch the image
  const response = await fetch(directUrl);
  if (!response.ok) {
    throw CustomApiError.create(404, "Image not found");
  }
  const contentType = response.headers.get(HeaderTypes.CONTENT_TYPE);
  const imageBuffer = await response.arrayBuffer();
  if (b64) {
    res.setHeader(HeaderTypes.CONTENT_TYPE, "text/plain");
    res.setHeader(HeaderTypes.X_CONTENT_ENCODING, "BASE64");
    res.setHeader(HeaderTypes.X_DECODED_CONTENT_TYPE, contentType ?? "application/octet-stream");
    res.send(Buffer.from(imageBuffer).toString("base64"));
  } else {
    res.setHeader(HeaderTypes.CONTENT_TYPE, contentType ?? "application/octet-stream");
    res.send(Buffer.from(imageBuffer));
  }
});
