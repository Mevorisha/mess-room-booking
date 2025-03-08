import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { authenticate } from "@/middlewares/auth";
import Identity, { Language } from "@/models/Identity";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";

/**
 * ```
 * import { Language } from "@/models/Identity";
 *
 * request = "PATCH /api/profile/[uid]/updateLanguage" { language: Language }
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

  const language = req.body["language"] as Language;
  if (!language) {
    throw new CustomApiError(400, "Missing field 'language: ENGLISH | BANGLA | HINDI'");
  }
  if (!["ENGLISH", "BANGLA", "HINDI"].includes(language)) {
    throw new CustomApiError(400, "Invalid field 'language: ENGLISH | BANGLA | HINDI'");
  }

  await Identity.update(uid, { language });
  return respond(res, { status: 200, message: "Field 'language' updated" });
});
