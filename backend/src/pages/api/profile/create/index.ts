import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { getLoggedInUser } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { FirebaseAuth } from "@/firebase/init";
import { RateLimits } from "@/middlewares/RateLimiter";
import { IdentityRepo } from "@/repo/IdentityRepo";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { ApiResponseUrlType, IdentityPostReqBodyDTO, HttpMethodTypes } from "sharedtypes";
import { CustomApiError } from "@/types/CustomApiError";

/**
 * ```
 * request = "POST /api/profile/create" { email: string, language?: "ENGLISH" | "HINDI" | "BANGLA" }
 * response = { uid: string }
 * ```
 */
export default WithMiddleware(async function POST(req: NextApiRequest, res: NextApiResponse) {
  RequestValidationParser.parse({ req, method: HttpMethodTypes.POST });

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);

  // Automatically throws ApiError and is caught by catchAll (middleware)
  const uid = authResult.getUid();

  if (!(await RateLimits.PROFILE_CREATE(uid, req, res))) return;

  const user = await FirebaseAuth.getUser(uid);

  const mobile = user.phoneNumber;
  const [firstName, lastName] = user.displayName?.split(" ") ?? [void 0, void 0];

  const updatePayload: { mobile?: string; firstName?: string; lastName?: string } = {};
  if (mobile != null) updatePayload.mobile = mobile;
  if (firstName != null) updatePayload.firstName = firstName;
  if (lastName != null) updatePayload.lastName = lastName;

  const profile = await IdentityRepo.findById(uid, ApiResponseUrlType.GS_PATH);
  if (profile != null) {
    await IdentityRepo.update(uid, updatePayload);
    return respond(res, { status: 200, json: { message: "Already exists", uid } });
  }

  const createResult = IdentityPostReqBodyDTO.fromJson(req.body);
  if (createResult.isErr) {
    throw CustomApiError.create(400, "Bad Request", createResult.error);
  }
  const createPayload = createResult.value;

  await IdentityRepo.create(uid, createPayload);
  await IdentityRepo.update(uid, updatePayload);
  return respond(res, { status: 200, json: { uid } });
});
