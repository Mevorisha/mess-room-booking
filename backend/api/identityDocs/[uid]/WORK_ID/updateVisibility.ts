import { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../../../../lib/utils/respond.js";
import { authenticate } from "../../../../middlewares/auth.js";
import Identity from "../../../../models/Identity.js";
import { withmiddleware } from "../../../../middlewares/withMiddleware.js";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/WORK_ID/updateVisibility" { visibility: "PUBLIC" | "PRIVATE" }
 * response = { message: string }
 * ```
 */
export default withmiddleware(async function PATCH(req: VercelRequest, res: VercelResponse) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }

  const uid = req.query["uid"] as string;
  if (!uid) {
    return respond(res, { status: 400, error: "Missing field 'uid: string'" });
  }
  // Require authentication middleware
  if (!(await authenticate(req, res, uid))) return;

  const visibility = req.body["visibility"] as "PUBLIC" | "PRIVATE";
  if (!visibility) {
    return respond(res, { status: 400, error: "Missing field 'visibility: PUBLIC | PRIVATE'" });
  }
  if (!["PUBLIC", "PRIVATE"].includes(visibility)) {
    return respond(res, { status: 400, error: "Invalid field 'visibility: PUBLIC | PRIVATE'" });
  }
  try {
    await Identity.update(uid, { identityPhotos: { workIdIsPrivate: visibility === "PRIVATE" } });
    return respond(res, { status: 200, message: `Governemnt ID made ${visibility.toLowerCase()}` });
  } catch (e) {
    return respond(res, { status: e.status ?? 500, error: e.message });
  }
});
