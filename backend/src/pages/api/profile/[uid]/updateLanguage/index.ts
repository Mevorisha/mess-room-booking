import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { authenticate } from "@/middlewares/Auth";
import Identity, { Language } from "@/models/Identity";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";

/**
 * ```
 * import { Language } from "@/models/Identity";
 *
 * request = "PATCH /api/profile/[uid]/updateLanguage" { language: Language }
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  const uid = req.query["uid"] as string;
  if (!uid) {
    throw CustomApiError.create(400, "Missing field 'uid: string'");
  }
  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.PROFILE_LANG_UPDATE(uid, req, res))) return;

  const language = req.body["language"] as Language;
  if (!language) {
    throw CustomApiError.create(400, "Missing field 'language: ENGLISH | BANGLA | HINDI'");
  }
  if (!["ENGLISH", "BANGLA", "HINDI"].includes(language)) {
    throw CustomApiError.create(400, "Invalid field 'language: ENGLISH | BANGLA | HINDI'");
  }

  await Identity.update(uid, { language });
  return respond(res, { status: 200, message: "Field 'language' updated" });
});
