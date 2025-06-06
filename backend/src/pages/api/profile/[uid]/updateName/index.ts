import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { authenticate } from "@/middlewares/Auth";
import Identity from "@/models/Identity";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/updateName" {
 *   firstName: string
 *   lastName: string
 * }
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

  if (!(await RateLimits.PROFILE_NAME_UPDATE(uid, req, res))) return;

  const firstName = req.body["firstName"] as string;
  const lastName = req.body["lastName"] as string;
  if (!firstName) {
    throw CustomApiError.create(400, "Missing field 'firstName: string'");
  }
  if (!lastName) {
    throw CustomApiError.create(400, "Missing field 'lastName: string'");
  }

  await Identity.update(uid, { firstName, lastName });
  return respond(res, { status: 200, message: "Fields 'firstName' and 'lastName' updated" });
});
