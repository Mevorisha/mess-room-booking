export class CustomApiError extends Error {
  status: number = 500;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }

  static create(status: number, message: string) {
    return new CustomApiError(status, message);
  }

  override toString() {
    return this.message;
  }
}
