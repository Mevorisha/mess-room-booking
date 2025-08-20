import { MultipleErrors } from "sharedtypes";

export class CustomApiError extends Error {
  status: number;

  private constructor(status: number, message: string, cause?: unknown) {
    if (Array.isArray(cause)) {
      super(message, { cause: new MultipleErrors(cause) });
    } else if (!(cause instanceof Error)) {
      super(message, { cause: new Error(JSON.stringify(cause)) });
    } else {
      super(message, { cause });
    }
    this.name = `CustomApiError [${status}]`;
    this.status = status;
  }

  static create(status: number, message: string, cause?: unknown): CustomApiError {
    return new CustomApiError(status, message, cause);
  }
}
