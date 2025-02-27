import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "../lib/firebaseAdmin/init.js";
import { respond } from "../lib/utils/respond.js";

/**
 * Middleware to authenticate Firebase token and get UID.
 */
export async function authenticate(
  req: VercelRequest,
  res: VercelResponse,
  next: (req: VercelRequest, res: VercelResponse) => void
) {
  try {
    const token = req.headers["x-firebase-token"] as string;
    if (!token) {
      return respond(res, { status: 401, error: "Missing 'x-firebase-token' header" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.query["uid"] = decodedToken.uid;
  } catch (error) {
    return respond(res, { status: 403, error: "Unauthorized" });
  }

  next(req, res);
}
