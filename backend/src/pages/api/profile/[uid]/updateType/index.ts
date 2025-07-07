import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { authenticate } from "@/middlewares/Auth";
import Identity from "@/models/Identity";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { IdentityType } from "@/models/types";

/**
 * ```
 * import { IdentityType } from "@/models/Identity";
 *
 * request = "PATCH /api/profile/[uid]/updateType" { type: IdentityType }
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  const uid = req.query["uid"] as string;
  if (!uid) {
    throw CustomApiError.create(400, "Missing field 'uid: string'");
  }
  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.PROFILE_TYPE_UPDATE(uid, req, res))) return;

  const type = req.body["type"] as IdentityType;
  if (!type) {
    throw CustomApiError.create(400, "Missing field 'type: OWNER | TENANT'");
  }
  if (!["OWNER", "TENANT"].includes(type)) {
    throw CustomApiError.create(400, "Invalid field 'type: OWNER | TENANT'");
  }

  await Identity.update(uid, { type });
  return respond(res, { status: 200, message: "Field 'type' updated" });
});
