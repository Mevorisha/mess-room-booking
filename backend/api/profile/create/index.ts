import { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../../../lib/utils/respond.js";
import { getLoggedInUser } from "../../../middlewares/auth.js";
import Identity from "../../../models/Identity.js";
import { withmiddleware } from "../../../middlewares/withMiddleware.js";

/**
 * ```
 * request = "POST /api/profile/create" { email: string }
 * response = { message: string }
 * ```
 */
export default withmiddleware(async function POST(req: VercelRequest, res: VercelResponse) {
  // Only allow POST method
  if (req.method !== "POST") {
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }

  // Auth middleware to get user
  const uid = await getLoggedInUser(req, res);
  if (!uid) {
    return respond(res, { status: 404, error: "User not found" });
  }

  const profile = await Identity.get(uid, "GS_PATH", []);
  if (profile) {
    return respond(res, { status: 200, message: "Already exists" });
  }

  const email = req.body["email"] as string;
  if (!email) {
    return respond(res, { status: 400, error: "Missing field 'email: string'" });
  }

  await Identity.create(uid, email);
  return respond(res, { status: 200, message: `Added user w/ email ${email}` });
});
