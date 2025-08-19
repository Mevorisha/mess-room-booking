import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { authenticate } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { ProfilePatchReqBodyDTO } from "sharedtypes";
import { IdentityRepo } from "@/repo/IdentityRepo";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";

/**
 * ```
 * import { Language } from "@/models/Identity";
 *
 * request = "PATCH /api/profile/[uid]/updateLanguage" { language: Language }
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  const { uid } = RequestValidationParser.parse({
    req,
    method: "PATCH",
    params: z.object({ uid: CommonZodSchemas.Basic.UID }),
  });

  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.PROFILE_LANG_UPDATE(uid, req, res))) return;

  const bodyResult = ProfilePatchReqBodyDTO.Language.fromJson(req.body);
  if (bodyResult.isErr) {
    throw CustomApiError.create(400, "Bad Request", bodyResult.error);
  }
  const { language } = bodyResult.value;

  await IdentityRepo.update(uid, { language });
  return respond(res, { status: 200, message: "Field 'language' updated" });
});
