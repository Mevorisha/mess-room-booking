import { VercelRequest, VercelResponse } from "@vercel/node";
import Identity, { SchemaFields } from "../../../../models/Identity.js";
import { respond } from "../../../../lib/utils/respond.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET method
  if (req.method !== "GET") {
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }
  // Extract user ID from request
  const uid = req.query["uid"] as string;
  if (!uid) {
    return respond(res, { status: 400, error: "Missing field 'uid: string'" });
  }
  try {
    const profile = await Identity.get(uid, [SchemaFields.PROFILE_PHOTOS]);
    if (!profile?.profilePhotos?.large) {
      return respond(res, { status: 404, error: "Image not found" });
    }
    // Redirect to the image URL
    return res.redirect(301, profile?.profilePhotos?.large);
  } catch (e) {
    return respond(res, { status: e.status ?? 500, error: e.message });
  }
}
