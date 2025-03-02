import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "../lib/firebaseAdmin/init.js";
import { respond } from "../lib/utils/respond.js";

export async function getLoggedInUser(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  try {
    const token = req.headers["x-firebase-token"] as string;
    if (!token) return null;
    const decodedToken = await admin.auth().verifyIdToken(token);
    const loggedInUid = decodedToken.uid;
    req.query["auth.uid"] = loggedInUid;
    return loggedInUid;
  } catch (e) {
    respond(res, { status: 401, error: "User auth failure" });
    return null;
  }
}

/**
 * Middleware to authenticate Firebase token and get UID.
 */
export async function authenticate(req: VercelRequest, res: VercelResponse, expectedUid: string): Promise<boolean> {
  try {
    const token = req.headers["x-firebase-token"] as string;
    if (!token) {
      respond(res, { status: 401, error: "Missing 'x-firebase-token' header" });
      return false;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.query["auth.uid"] = decodedToken.uid;

    if (expectedUid === req.query["auth.uid"]) return true;
    else return false;
  } catch (e) {
    respond(res, { status: 401, error: "User auth failure" });
    return false;
  }
}
