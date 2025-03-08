import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { authenticate } from "@/middlewares/auth";
import Identity from "@/models/Identity";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/updateType" { mobile: string }
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

  const mobile = req.body["mobile"] as string;
  if (!mobile) {
    throw new CustomApiError(400, "Missing field 'mobile: string'");
  }

  await Identity.update(uid, { mobile });
  return respond(res, { status: 200, message: "Field 'mobile' updated" });
});
