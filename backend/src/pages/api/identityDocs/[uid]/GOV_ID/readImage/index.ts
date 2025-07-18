import { NextApiRequest, NextApiResponse } from "next";
import Identity, { SchemaFields } from "@/models/Identity";
import { getLoggedInUser } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { MultiSizeImageSz } from "@/firebase/init";
import { gsPathToUrl } from "@/models/utils/gsUrlManager";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import HeaderTypes from "@/types/HeaderTypes";

/**
 * ```
 * request = "GET /api/identityDocs/[uid]/GOV_ID/readImage?size=(small|medium|large)&b64=boolean"
 * response = text/plain (base64) is b64 = true, else image/*
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (!(await RateLimits.ID_DOC_READ(req, res))) return;

  // Only allow GET method
  if (req.method !== "GET") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }
  // Extract user ID from request
  const uid = req.query["uid"] as string;
  const size = req.query["size"] as MultiSizeImageSz;
  const b64 = req.query["b64"] === "true" ? true : false;
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
  if (!profile?.identityPhotos?.govId || !profile?.identityPhotos?.govId[size]) {
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
  const directUrl = await gsPathToUrl(profile?.identityPhotos?.govId[size]);
  const response = await fetch(directUrl);
  if (!response.ok) {
    throw CustomApiError.create(500, "Failed to fetch image");
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
