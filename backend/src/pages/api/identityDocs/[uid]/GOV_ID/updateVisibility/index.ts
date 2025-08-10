import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { authenticate } from "@/middlewares/Auth";
import Identity from "@/models/Identity";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { IdentityReqReadImageVisibilityQuery } from "sharedtypes";

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

  if (typeof req.query["uid"] !== "string" || req.query["uid"].length === 0) {
    throw CustomApiError.create(400, "Missing or invalid field 'uid: string'");
  }

  const uid = req.query["uid"];

  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.ID_DOC_VIS_UPDATE(uid, req, res))) return;

  const queryResult = IdentityReqReadImageVisibilityQuery.create(req);
  if (queryResult.isErr) {
    throw CustomApiError.create(queryResult.error.apiStatusCode, queryResult.error.message);
  }
  const { visibility } = queryResult.value;

  await Identity.update(uid, { identityPhotos: { govIdIsPrivate: visibility === "PRIVATE" } });
  return respond(res, { status: 200, message: `Governemnt ID made ${visibility.toLowerCase()}` });
});
