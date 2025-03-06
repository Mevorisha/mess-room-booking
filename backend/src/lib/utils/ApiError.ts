export class ApiError extends Error {
  status: number = 500;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }

  static create(status: number, message: string) {
    return new ApiError(status, message);
  }

  toString() {
    return this.message;
  }
}
