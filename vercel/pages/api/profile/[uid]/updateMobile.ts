import { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../../../../lib/utils/respond.js";
import { authenticate } from "../../../../middlewares/auth.js";
import Identity from "../../../../models/Identity.js";
import { withmiddleware } from "../../../../middlewares/withMiddleware.js";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/updateType" { mobile: string }
 * response = { message: string }
 * ```
 */
export default withmiddleware(async function PATCH(req: VercelRequest, res: VercelResponse) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }
  // Require authentication middleware
  if (!(await authenticate(req, res))) return;

  const uid = req.query["uid"] as string;
  const mobile = req.body["mobile"] as string;
  if (!uid) {
    return respond(res, { status: 400, error: "Missing field 'uid: string'" });
  }
  if (!mobile) {
    return respond(res, { status: 400, error: "Missing field 'mobile: string'" });
  }
  try {
    await Identity.update(uid, { mobile });
    return respond(res, { status: 200, message: "Field 'mobile' updated" });
  } catch (e) {
    return respond(res, { status: e.status ?? 500, error: e.message });
  }
});
