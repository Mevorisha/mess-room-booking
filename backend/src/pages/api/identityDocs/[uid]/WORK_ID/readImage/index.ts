import { NextApiRequest, NextApiResponse } from "next";
import Identity, { SchemaFields } from "@/models/Identity";
import { getLoggedInUser } from "@/middlewares/auth";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { MultiSizeImageSz } from "@/lib/firebaseAdmin/init";
import { gsPathToUrl } from "@/models/utils";
import { CustomApiError } from "@/lib/utils/ApiError";

/**
 * ```
 * request = "GET /api/identityDocs/[uid]/WORK_ID/readImage?size=(small|medium|large)"
 * response = 301 to "Content-Type: image/(jpeg|png)"
 * ```
 */
export default withmiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET method
  if (req.method !== "GET") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }
  // Extract user ID from request
  const uid = req.query["uid"] as string;
  const size = req.query["size"] as MultiSizeImageSz;
  if (!uid) {
    throw CustomApiError.create(400, "Missing field 'uid: string'");
  }
  if (!size) {
    throw CustomApiError.create(400, "Missing query 'size: small | medium | large'");
  }
  if (!["small", "medium", "large"].includes(size)) {
    throw CustomApiError.create(400, "Invalid query 'size: small | medium | large'");
  }

  const profile = await Identity.get(uid, "GS_PATH", [SchemaFields.IDENTITY_PHOTOS]);
  if (!profile?.identityPhotos?.workId || !profile?.identityPhotos?.workId[size]) {
    throw CustomApiError.create(404, "Image not found");
  }
  if (profile.identityPhotos.workIdIsPrivate) {
    // Require authentication middleware
    const authResult = await getLoggedInUser(req);
    if (authResult.isSuccess() && authResult.getUid() !== uid) {
      throw CustomApiError.create(403, "Cannot view private resource");
    }
    // Trigger ApiError
    if (!authResult.isSuccess()) authResult.getUid();
  }
  // Get image direct URL and send binary data
  const directUrl = await gsPathToUrl(profile?.identityPhotos?.workId[size]);
  const response = await fetch(directUrl);
  if (!response.ok) {
    throw CustomApiError.create(500, "Failed to fetch image");
  }
  const contentType = response.headers.get("content-type");
  const imageBuffer = await response.arrayBuffer();
  res.setHeader("Content-Type", contentType || "application/octet-stream");
  res.send(Buffer.from(imageBuffer));
});
