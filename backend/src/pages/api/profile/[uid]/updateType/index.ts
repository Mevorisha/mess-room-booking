import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { authenticate } from "@/middlewares/auth";
import Identity, { IdentityType } from "@/models/Identity";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";

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
    throw new CustomApiError(405, "Method Not Allowed");
  }

  const uid = req.query["uid"] as string;
  if (!uid) {
    throw new CustomApiError(400, "Missing field 'uid: string'");
  }
  // Require authentication middleware
  await authenticate(req, uid);

  const type = req.body["type"] as IdentityType;
  if (!type) {
    throw new CustomApiError(400, "Missing field 'type: OWNER | TENANT'");
  }
  if (!["OWNER", "TENANT"].includes(type)) {
    throw new CustomApiError(400, "Invalid field 'type: OWNER | TENANT'");
  }

  await Identity.update(uid, { type });
  return respond(res, { status: 200, message: "Field 'type' updated" });
});
