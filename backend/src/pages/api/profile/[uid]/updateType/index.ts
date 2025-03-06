import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { authenticate } from "@/middlewares/auth";
import Identity, { IdentityType } from "@/models/Identity";
import { withmiddleware } from "@/middlewares/withMiddleware";

/**
 * ```
 * import { IdentityType } from "@/models/Identity";
 *
 * request = "PATCH /api/profile/[uid]/updateType" { type: IdentityType }
 * response = { message: string }
 * ```
 */
export default withmiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
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

  const type = req.body["type"] as IdentityType;
  if (!type) {
    return respond(res, { status: 400, error: "Missing field 'type: OWNER | TENANT'" });
  }
  if (!["OWNER", "TENANT"].includes(type)) {
    return respond(res, { status: 400, error: "Invalid field 'type: OWNER | TENANT'" });
  }

  await Identity.update(uid, { type });
  return respond(res, { status: 200, message: "Field 'type' updated" });
});
