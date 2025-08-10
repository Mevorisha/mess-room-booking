import { NextApiRequest, NextApiResponse } from "next";
import Identity, { SchemaFields } from "@/models/Identity";
import { getLoggedInUser } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { gsPathToUrl } from "@/models/utils/gsUrlManager";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import HeaderTypes from "@/types/HeaderTypes";
import { IdentityReqReadImageQuery } from "sharedtypes";

/**
 * ```
 * request = "GET /api/identityDocs/[uid]/WORK_ID/readImage?size=(small|medium|large)&b64=boolean"
 * response = text/plain (base64) is b64 = true, else image/*
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (!(await RateLimits.ID_DOC_READ(req, res))) return;

  // Only allow GET method
  if (req.method !== "GET") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  // Extract query params from request
  const queryResult = IdentityReqReadImageQuery.create(req);
  if (queryResult.isErr) {
    throw CustomApiError.create(queryResult.error.apiStatusCode, queryResult.error.message);
  }
  const { uid, size, b64 } = queryResult.value;

  const profile = await Identity.get(uid, "GS_PATH", [SchemaFields.IDENTITY_PHOTOS]);
  if (profile?.identityPhotos?.workId == null || profile.identityPhotos.workId[size] === "") {
    throw CustomApiError.create(404, "Image not found");
  }

  if (profile.identityPhotos.workIdIsPrivate ?? false) {
    // Require authentication middleware
    const authResult = await getLoggedInUser(req);
    if (authResult.isSuccess() && authResult.getUid() !== uid) {
      throw CustomApiError.create(403, "Cannot view private resource");
    }
    // Trigger ApiError
    if (!authResult.isSuccess()) authResult.getUid();
  }

  // Get image direct URL and send binary data
  const directUrl = await gsPathToUrl(profile.identityPhotos.workId[size]);
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
