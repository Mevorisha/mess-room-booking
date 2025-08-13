import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { authenticate } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { RateLimits } from "@/middlewares/RateLimiter";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { IdentityRepo } from "@/repo/IdentityRepo";
import { IdentityPatchImageVisibilityDTO } from "sharedtypes";
import { CustomApiError } from "@/types/CustomApiError";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/WORK_ID/updateVisibility" { visibility: "PUBLIC" | "PRIVATE" }
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Extract query params from request
  const { uid } = RequestValidationParser.parse({
    req,
    method: "PATCH",
    params: z.object({ uid: RequestValidationParser.CommonSchema.UID }),
  });

  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.ID_DOC_VIS_UPDATE(uid, req, res))) return;

  const bodyResult = IdentityPatchImageVisibilityDTO.fromJson(req.body);
  if (bodyResult.isErr) {
    throw CustomApiError.create(400, "Bad Request", bodyResult.error);
  }
  const { visibility } = bodyResult.value;

  await IdentityRepo.update(uid, { identityPhotos: { workIdIsPrivate: visibility === "PRIVATE" } });
  return respond(res, { status: 200, message: `Work ID made ${visibility.toLowerCase()}` });
});
