import { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../../../lib/utils/respond.js";
import { authenticate } from "../../../middlewares/auth.js";
import Identity from "../../../models/Identity.js";
import { withmiddleware } from "../../../middlewares/withMiddleware.js";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/updateName" {
 *   firstName: string
 *   lastName: string
 * }
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

  const firstName = req.body["firstName"] as string;
  const lastName = req.body["lastName"] as string;
  if (!firstName) {
    return respond(res, { status: 400, error: "Missing field 'firstName: string'" });
  }
  if (!lastName) {
    return respond(res, { status: 400, error: "Missing field 'lastName: string'" });
  }
  try {
    await Identity.update(uid, { firstName, lastName });
    return respond(res, { status: 200, message: "Fields 'firstName' and 'lastName' updated" });
  } catch (e) {
    return respond(res, { status: e.status ?? 500, error: e.message });
  }
});
