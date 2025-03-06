import type { NextApiRequest, NextApiResponse } from "next";
import { FirebaseAuth } from "@/lib/firebaseAdmin/init";
import { respond } from "@/lib/utils/respond";
import { ApiError } from "@/lib/utils/ApiError";

export async function getLoggedInUser(
  req: NextApiRequest,
  _: NextApiResponse,
  errOnMissingCred = false
): Promise<string | null> {
  try {
    const token = req.headers["x-firebase-token"] as string;
    if (!token) {
      if (errOnMissingCred) {
        throw new ApiError(403, "Missing X-Firebase-Token header");
      } else {
        return null;
      }
    }
    const decodedToken = await FirebaseAuth.verifyIdToken(token);
    const loggedInUid = decodedToken.uid;
    req.query["auth.uid"] = loggedInUid;
    return loggedInUid;
  } catch (e) {
    console.trace(e);
    return null;
  }
}

/**
 * Middleware to authenticate Firebase token and get UID.
 */
export async function authenticate(req: NextApiRequest, res: NextApiResponse, expectedUid: string): Promise<boolean> {
  try {
    const token = req.headers["x-firebase-token"] as string;
    if (!token) {
      respond(res, { status: 401, error: "Missing 'x-firebase-token' header" });
      return false;
    }

    const decodedToken = await FirebaseAuth.verifyIdToken(token);
    req.query["auth.uid"] = decodedToken.uid;

    if (expectedUid === req.query["auth.uid"]) return true;
    else return false;
  } catch (e) {
    respond(res, { status: 401, error: "User auth failure" });
    return false;
  }
}
