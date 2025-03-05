import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { authenticate } from "@/middlewares/auth";
import Identity, { Language } from "@/models/Identity";
import { withmiddleware } from "@/middlewares/withMiddleware";

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
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }

  const uid = req.query["uid"] as string;
  if (!uid) {
    return respond(res, { status: 400, error: "Missing field 'uid: string'" });
  }
  // Require authentication middleware
  if (!(await authenticate(req, res, uid))) return;

  const language = req.body["language"] as Language;
  if (!language) {
    return respond(res, { status: 400, error: "Missing field 'language: ENGLISH | BANGLA | HINDI'" });
  }
  if (!["ENGLISH", "BANGLA", "HINDI"].includes(language)) {
    return respond(res, { status: 400, error: "Invalid field 'language: ENGLISH | BANGLA | HINDI'" });
  }

  await Identity.update(uid, { language });
  return respond(res, { status: 200, message: "Field 'language' updated" });
});
