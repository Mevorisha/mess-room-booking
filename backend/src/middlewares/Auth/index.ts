import type { NextApiRequest } from "next";
import { FirebaseAuth } from "@/firebase/init";
import { CustomApiError } from "@/types/CustomApiError";
import { AuthResult } from "./AuthResult";

export async function getLoggedInUser(req: NextApiRequest): Promise<AuthResult> {
  try {
    const token = req.headers["x-firebase-token"] as string;
    if (!token) {
      return AuthResult.create("MISSING_CREDS");
    }
    const decodedToken = await FirebaseAuth.verifyIdToken(token);
    const loggedInUid = decodedToken.uid;
    req.query["auth.uid"] = loggedInUid;
    return AuthResult.create("USER_FOUND", loggedInUid);
  } catch (e) {
    console.trace(e);
    return AuthResult.create("USER_NOT_FOUND");
  }
}

/**
 * Middleware to authenticate Firebase token and get UID.
 * Throws error if not logged in.
 * @returns {Promise<string>} UID of authenticated user
 * @throws {CustomApiError} If not authenticated
 */
export async function authenticate(req: NextApiRequest, expectedUid?: string): Promise<string> {
  const authResult = await getLoggedInUser(req);
  const loggedInUid = authResult.getUid();

  if (typeof expectedUid === "string") {
    if (expectedUid === loggedInUid) {
      return loggedInUid;
    } else {
      throw CustomApiError.create(401, "Invalid auth credentials");
    }
  } else {
    if (loggedInUid) return loggedInUid;
    else throw CustomApiError.create(500, "Authentication failure");
  }
}
