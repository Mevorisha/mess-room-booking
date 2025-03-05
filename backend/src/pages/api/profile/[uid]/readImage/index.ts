import { NextApiRequest, NextApiResponse } from "next";
import Identity, { SchemaFields } from "@/models/Identity";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { MultiSizeImageSz } from "@/lib/firebaseAdmin/init";
import { gsPathToUrl } from "@/models/utils";

/**
 * ```
 * request = "GET /api/profile/[uid]/readImage?size=(small|medium|large)"
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

  const profile = await Identity.get(uid, "GS_PATH", [SchemaFields.PROFILE_PHOTOS]);
  if (!profile?.profilePhotos || !profile?.profilePhotos[size]) {
    return respond(res, { status: 404, error: "Image not found" });
  }
  // Get image direct URL and redirect
  const directUrl = await gsPathToUrl(profile?.profilePhotos[size]);
  return res.redirect(301, directUrl);
});
