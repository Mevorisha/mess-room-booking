import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { getLoggedInUser } from "@/middlewares/auth";
import Identity from "@/models/Identity";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";

/**
 * ```
 * request = "POST /api/profile/create" { email: string }
 * response = { uid: string }
 * ```
 */
export default withmiddleware(async function POST(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== "POST") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  // Automatically throws ApiError and is caught by catchAll (middleware)
  const uid = authResult.getUid();

  const profile = await Identity.get(uid, "GS_PATH", []);
  if (profile) {
    return respond(res, { status: 200, json: { message: "Already exists", uid } });
  }

  const email = req.body["email"] as string;
  if (!email) {
    throw CustomApiError.create(400, "Missing field 'email: string'");
  }

  await Identity.create(uid, email);
  return respond(res, { status: 200, json: { uid } });
});
