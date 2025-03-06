import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { authenticate } from "@/middlewares/auth";
import Identity from "@/models/Identity";
import { withmiddleware } from "@/middlewares/withMiddleware";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/GOV_ID/updateVisibility" { visibility: "PUBLIC" | "PRIVATE" }
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

  const visibility = req.body["visibility"] as "PUBLIC" | "PRIVATE";
  if (!visibility) {
    return respond(res, { status: 400, error: "Missing field 'visibility: PUBLIC | PRIVATE'" });
  }
  if (!["PUBLIC", "PRIVATE"].includes(visibility)) {
    return respond(res, { status: 400, error: "Invalid field 'visibility: PUBLIC | PRIVATE'" });
  }

  await Identity.update(uid, { identityPhotos: { govIdIsPrivate: visibility === "PRIVATE" } });
  return respond(res, { status: 200, message: `Governemnt ID made ${visibility.toLowerCase()}` });
});
