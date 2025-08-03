export class CustomApiError extends Error {
  status = 500;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }

  static create(status: number, message: string): CustomApiError {
    return new CustomApiError(status, message);
  }

  override toString(): string {
    return this.message;
  }
}
