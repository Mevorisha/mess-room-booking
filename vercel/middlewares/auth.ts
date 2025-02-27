import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "../lib/firebaseAdmin/init.js";
import { respond } from "../lib/utils/respond.js";

/**
 * Middleware to authenticate Firebase token and get UID.
 */
export async function authenticate(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  try {
    const token = req.headers["x-firebase-token"] as string;
    if (!token) {
      respond(res, { status: 401, error: "Missing 'x-firebase-token' header" });
      return false;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.query["uid"] = decodedToken.uid;
  } catch (e) {
    respond(res, { status: 500, error: "Auth middleware failure" });
    return false;
  }

  return true;
}
