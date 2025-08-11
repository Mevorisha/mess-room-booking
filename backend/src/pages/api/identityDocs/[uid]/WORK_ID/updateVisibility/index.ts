import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { authenticate } from "@/middlewares/Auth";
import Identity from "@/models/Identity";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { RateLimits } from "@/middlewares/RateLimiter";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/WORK_ID/updateVisibility" { visibility: "PUBLIC" | "PRIVATE" }
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

  await Identity.update(uid, { identityPhotos: { workIdIsPrivate: visibility === "PRIVATE" } });
  return respond(res, { status: 200, message: `Work ID made ${visibility.toLowerCase()}` });
});
