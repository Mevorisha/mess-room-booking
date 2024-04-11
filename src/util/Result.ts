export default class Result<T> {
  private _error?: string;
  private _value?: T;

  constructor(value?: T, error?: string) {
    this._value = value;
    this._error = error;
  }

  static ok<T>(value: T) {
    return new Result(value);
  }

  static err(error: string) {
    return new Result(null, error);
  }

  isOk() {
    return this._error === null;
  }

  isErr() {
    return !this.isOk();
  }

  getOk() {
    if (this.isErr()) {
      throw new Error("Cannot get value of failed result.");
    }
    return this._value as T;
  }

  getErr() {
    if (this.isOk()) {
      throw new Error("Cannot get error of successful result.");
    }
    return this._error as string;
  }
}
