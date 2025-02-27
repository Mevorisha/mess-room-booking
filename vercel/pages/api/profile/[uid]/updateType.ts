import { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../../../../lib/utils/respond.js";
import { authenticate } from "../../../../middlewares/auth.js";
import Identity, { IdentityType } from "../../../../models/Identity.js";

/**
 * ```
 * import { IdentityType } from "../../../../models/Identity.js";
 *
 * request = "PATCH /api/profile/[uid]/updateType" { type: IdentityType }
 * response = { message: string }
 * ```
 */
export default async function PATCH(req: VercelRequest, res: VercelResponse) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }
  // Require authentication middleware
  if (!(await authenticate(req, res))) return;

  const uid = req.query["uid"] as string;
  const type = req.body["type"] as IdentityType;
  if (!uid) {
    return respond(res, { status: 400, error: "Missing field 'uid: string'" });
  }
  if (!type) {
    return respond(res, { status: 400, error: "Missing field 'type: OWNER | TENANT'" });
  }
  if (!["OWNER", "TENANT"].includes(type)) {
    return respond(res, { status: 400, error: "Invalid field 'type: OWNER | TENANT'" });
  }
  try {
    await Identity.update(uid, { type });
    return respond(res, { status: 200, error: "Field 'type' updated" });
  } catch (e) {
    return respond(res, { status: e.status ?? 500, error: e.message });
  }
}
