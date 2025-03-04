import { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../../../../lib/utils/respond.js";
import { authenticate } from "../../../../middlewares/auth.js";
import Identity, { Language } from "../../../../models/Identity.js";
import { withmiddleware } from "../../../../middlewares/withMiddleware.js";

/**
 * ```
 * import { Language } from "../../../../../models/Identity.js";
 *
 * request = "PATCH /api/profile/[uid]/updateLanguage" { language: Language }
 * response = { message: string }
 * ```
 */
export default withmiddleware(async function PATCH(req: VercelRequest, res: VercelResponse) {
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
