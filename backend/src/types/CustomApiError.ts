export class CustomApiError extends Error {
  status: number;

  private constructor(status: number, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = `CustomApiError [${status}]`;
    this.status = status;
  }

  static create(status: number, message: string, cause?: unknown): CustomApiError {
    return new CustomApiError(status, message, cause);
  }
}
