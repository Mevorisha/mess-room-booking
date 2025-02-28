import { VercelRequest, VercelResponse } from "@vercel/node";
import Identity, { SchemaFields } from "../../../../../models/Identity.js";
import { respond } from "../../../../../lib/utils/respond.js";
import { authenticate } from "../../../../../middlewares/auth.js";
import { withmiddleware } from "../../../../../middlewares/withMiddleware.js";

/**
 * ```
 * request = "GET /api/identityDocs/[uid]/WORK_ID/readImage?size=(small|medium|large)"
 * response = 301 to "Content-Type: image/(jpeg|png)"
 * ```
 */
export default withmiddleware(async function GET(req: VercelRequest, res: VercelResponse) {
  // Only allow GET method
  if (req.method !== "GET") {
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }
  // Extract user ID from request
  const uid = req.query["uid"] as string;
  const size = req.query["size"] as "small" | "medium" | "large";
  if (!uid) {
    return respond(res, { status: 400, error: "Missing field 'uid: string'" });
  }
  if (!size) {
    return respond(res, { status: 400, error: "Missing query 'size: small | medium | large'" });
  }
  if (!["small", "medium", "large"].includes(size)) {
    return respond(res, { status: 400, error: "Invalid query 'size: small | medium | large'" });
  }
  try {
    const profile = await Identity.get(uid, [SchemaFields.IDENTITY_PHOTOS]);
    if (!profile?.identityPhotos?.workid) {
      return respond(res, { status: 404, error: "Image not found" });
    }
    if (profile.identityPhotos.workIdIsPrivate) {
      // Require authentication middleware
      if (!(await authenticate(req, res))) return;
    }
    // Redirect to the image URL
    return res.redirect(301, profile?.identityPhotos?.workid[size]);
  } catch (e) {
    return respond(res, { status: e.status ?? 500, error: e.message });
  }
});
