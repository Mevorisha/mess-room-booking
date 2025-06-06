import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { authenticate } from "@/middlewares/Auth";
import Identity from "@/models/Identity";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/GOV_ID/updateVisibility" { visibility: "PUBLIC" | "PRIVATE" }
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

  if (!(await RateLimits.ID_DOC_VIS_UPDATE(uid, req, res))) return;

  const visibility = req.body["visibility"] as "PUBLIC" | "PRIVATE";
  if (!visibility) {
    throw CustomApiError.create(400, "Missing field 'visibility: PUBLIC | PRIVATE'");
  }
  if (!["PUBLIC", "PRIVATE"].includes(visibility)) {
    throw CustomApiError.create(400, "Invalid field 'visibility: PUBLIC | PRIVATE'");
  }

  await Identity.update(uid, { identityPhotos: { govIdIsPrivate: visibility === "PRIVATE" } });
  return respond(res, { status: 200, message: `Governemnt ID made ${visibility.toLowerCase()}` });
});
