import { CustomApiError } from "@/types/CustomApiError";

type AuthStatus = "USER_FOUND" | "USER_NOT_FOUND" | "MISSING_CREDS";

export class AuthResult {
  #status: AuthStatus;
  #uid: string | null;

  constructor(status: AuthStatus, uid?: string) {
    this.#status = status;
    this.#uid = null;
    if (typeof uid === "string") {
      this.#uid = uid;
    }
  }

  static create(status: AuthStatus, uid?: string): AuthResult {
    return new AuthResult(status, uid);
  }

  /**
   * If a valid auth token is found
   */
  isSuccess(): boolean {
    return this.#status === "USER_FOUND";
  }

  /**
   * If auth token is not valid
   */
  isNotFound(): boolean {
    return this.#status === "USER_NOT_FOUND";
  }

  /**
   * If no auth token is found
   */
  isMissingCreds(): boolean {
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
        throw CustomApiError.create(500, "Internal Server Error", "Authentication failure: UID is not a string");
      }
    }
    throw CustomApiError.create(500, "Internal Server Error", "Authentication failure: Invalid auth state");
  }
}
