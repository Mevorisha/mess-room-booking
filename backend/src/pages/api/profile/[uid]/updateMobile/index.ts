import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { authenticate } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { HttpMethodTypes, ProfilePatchReqBodyDTO } from "sharedtypes";
import { IdentityRepo } from "@/repo/IdentityRepo";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";

/**
 * ```
 * request = "PATCH /api/profile/[uid]/updateType" { mobile: string }
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  const { uid } = RequestValidationParser.parse({
    req,
    method: HttpMethodTypes.PATCH,
    params: z.object({ uid: CommonZodSchemas.Basic.UID }),
  });

  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.PROFILE_MOBILE_UPDATE(uid, req, res))) return;

  const bodyResult = ProfilePatchReqBodyDTO.Mobile.fromJson(req.body);
  if (bodyResult.isErr) {
    throw CustomApiError.create(400, "Bad Request", bodyResult.error);
  }
  const { mobile } = bodyResult.value;

  await IdentityRepo.update(uid, { mobile });
  return respond(res, { status: 200, message: "Field 'mobile' updated" });
});
