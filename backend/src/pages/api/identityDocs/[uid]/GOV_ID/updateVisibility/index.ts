import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { authenticate } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { RateLimits } from "@/middlewares/RateLimiter";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { IdentityRepo } from "@/repo/IdentityRepo";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/GOV_ID/updateVisibility" { visibility: "PUBLIC" | "PRIVATE" }
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Extract query params from request
  const { uid, visibility } = RequestValidationParser.parse({
    req,
    method: "PATCH",
    params: z.object({
      uid: RequestValidationParser.CommonSchema.UID,
      visibility: RequestValidationParser.CommonSchema.DOC_VISIBILITY,
    }),
  });

  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.ID_DOC_VIS_UPDATE(uid, req, res))) return;

  await IdentityRepo.update(uid, { identityPhotos: { govIdIsPrivate: visibility === "PRIVATE" } });
  return respond(res, { status: 200, message: `Governemnt ID made ${visibility.toLowerCase()}` });
});
