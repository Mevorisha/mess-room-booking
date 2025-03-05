import { NextApiRequest, NextApiResponse } from "next";
import Identity, { SchemaFields } from "@/models/Identity";
import { respond } from "@/lib/utils/respond";
import { authenticate } from "@/middlewares/auth";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { MultiSizeImageSz } from "@/lib/firebaseAdmin/init";
import { gsPathToUrl } from "@/models/utils";

/**
 * ```
 * request = "GET /api/identityDocs/[uid]/WORK_ID/readImage?size=(small|medium|large)"
 * response = 301 to "Content-Type: image/(jpeg|png)"
 * ```
 */
export default withmiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET method
  if (req.method !== "GET") {
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }
  // Extract user ID from request
  const uid = req.query["uid"] as string;
  const size = req.query["size"] as MultiSizeImageSz;
  if (!uid) {
    return respond(res, { status: 400, error: "Missing field 'uid: string'" });
  }
  if (!size) {
    return respond(res, { status: 400, error: "Missing query 'size: small | medium | large'" });
  }
  if (!["small", "medium", "large"].includes(size)) {
    return respond(res, { status: 400, error: "Invalid query 'size: small | medium | large'" });
  }

  const profile = await Identity.get(uid, "GS_PATH", [SchemaFields.IDENTITY_PHOTOS]);
  if (!profile?.identityPhotos?.workId || !profile?.identityPhotos?.workId[size]) {
    return respond(res, { status: 404, error: "Image not found" });
  }
  if (profile.identityPhotos.workIdIsPrivate) {
    // Require authentication middleware
    if (!(await authenticate(req, res, uid))) return;
  }
  // Get image direct URL and redirect
  const directUrl = await gsPathToUrl(profile?.identityPhotos?.workId[size]);
  return res.redirect(301, directUrl);
});
