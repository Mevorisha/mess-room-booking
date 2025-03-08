import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { authenticate } from "@/middlewares/auth";
import Identity from "@/models/Identity";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/WORK_ID/updateVisibility" { visibility: "PUBLIC" | "PRIVATE" }
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

  const visibility = req.body["visibility"] as "PUBLIC" | "PRIVATE";
  if (!visibility) {
    throw new CustomApiError(400, "Missing field 'visibility: PUBLIC | PRIVATE'");
  }
  if (!["PUBLIC", "PRIVATE"].includes(visibility)) {
    throw new CustomApiError(400, "Invalid field 'visibility: PUBLIC | PRIVATE'");
  }

  await Identity.update(uid, { identityPhotos: { workIdIsPrivate: visibility === "PRIVATE" } });
  return respond(res, { status: 200, message: `Governemnt ID made ${visibility.toLowerCase()}` });
});
