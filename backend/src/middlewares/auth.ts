import type { NextApiRequest } from "next";
import { FirebaseAuth } from "@/lib/firebaseAdmin/init";
import { CustomApiError } from "@/lib/utils/ApiError";

type AuthStatus = "USER_FOUND" | "USER_NOT_FOUND" | "MISSING_CREDS";

class AuthResult {
  #status: AuthStatus;
  #uid: string | null;

  constructor(status: AuthStatus, uid?: string) {
    this.#status = status;
    this.#uid = null;
    if (typeof uid === "string") {
      this.#uid = uid;
    }
  }

  static create(status: AuthStatus, uid?: string) {
    return new AuthResult(status, uid);
  }

  /**
   * If a valid auth token is found
   */
  isSuccess() {
    return this.#status === "USER_FOUND";
  }

  /**
   * If auth token is not valid
   */
  isNotFound() {
    return this.#status === "USER_NOT_FOUND";
  }

  /**
   * If no auth token is found
   */
  isMissingCreds() {
    return this.#status === "MISSING_CREDS";
  }

  /**
   * @throws {CustomApiError} If no user UID is found
   */
  getUid(): string {
    if (this.isNotFound()) {
      throw CustomApiError.create(401, "Invalid auth credentials");
    }
    if (this.isMissingCreds()) {
      throw CustomApiError.create(401, "Missing auth credentials");
    }
    if (this.isSuccess()) {
      if (typeof this.#uid === "string") {
        return this.#uid;
      } else {
        throw CustomApiError.create(500, "Auth error");
      }
    }
    throw CustomApiError.create(500, "Authentication failure");
  }
}

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
