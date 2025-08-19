import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { getLoggedInUser } from "@/middlewares/Auth";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { IdentityRepo } from "@/repo/IdentityRepo";
import { ApiResponseUrlType } from "sharedtypes";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";

/**
 * ```
 * import { IdentityType, Language } from "@/models/Identity";
 *
 * request = "GET /api/profile/[uid]/read"
 *
 * response = {
 *   displayName?: string
 *   firstName?: string
 *   lastName?: string
 *   mobile?: string
 *   profilePhotos?: {
 *     small: string (api uri)
 *     medium: string (api uri)
 *     large: string (api uri)
 *   }
 *
 * < The following need authentication >
 *
 *   email: string
 *   type: IdentityType
 *   language?: Language
 *   identityPhotos?: {
 *     workId?: {
 *       small: string (api uri)
 *       medium: string (api uri)
 *       large: string (api uri)
 *     }
 *     govId?: {
 *       small: string (api uri)
 *       medium: string (api uri)
 *       large: string (api uri)
 *     }
 *     workIdIsPrivate?: boolean
 *     govIdIsPrivate?: boolean
 *   }
 *   createdOn: string (ISO date)
 *   lastModifiedOn: string (ISO date)
 *   ttl?: string (ISO date)
 *   isDeleted: boolean
 * }
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  const { uid } = RequestValidationParser.parse({
    req,
    method: "GET",
    params: z.object({ uid: CommonZodSchemas.Basic.UID }),
  });

  if (!(await RateLimits.PROFILE_READ(req, res))) return;

  // If logged-in, send additional identity information
  const authResult = await getLoggedInUser(req);
  if (authResult.isSuccess()) {
    const loggedInUid = authResult.getUid();
    if (loggedInUid === uid) {
      const result = await IdentityRepo.findById(uid, ApiResponseUrlType.API_URI, { auth: true });
      if (result == null) {
        throw CustomApiError.create(404, "User not found");
      }
      return respond(res, { status: 200, dto: result });
    }
  }

  const result = await IdentityRepo.findById(uid, ApiResponseUrlType.API_URI, { auth: false });
  if (result == null) {
    throw CustomApiError.create(404, "User not found");
  }
  return respond(res, { status: 200, dto: result });
});
