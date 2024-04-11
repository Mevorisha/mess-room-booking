/**
 * @template T
 * @class Result
 */
class Result {
  /**
   * @param {T?} value
   * @param {string?} error
   */
  constructor(value, error) {
    this._value = value;
    this._error = error;
  }

  /**
   * @template T
   * @param {T} value
   * @returns {Result<T>}
   */
  static ok(value) {
    return new Result(value, null);
  }

  /**
   * @param {string} error
   * @returns {Result<null>}
   */
  static err(error) {
    return new Result(null, error);
  }

  isOk() {
    return this._error === null;
  }

  isErr() {
    return !this.isOk();
  }

  /**
   * @returns {T}
   */
  getOk() {
    if (this.isErr()) {
      throw new Error("Cannot get value of failed result.");
    }
    // @ts-ignore
    return this._value;
  }

  /**
   * @returns {string}
   */
  getErr() {
    if (this.isOk()) {
      throw new Error("Cannot get error of successful result.");
    }
    // @ts-ignore
    return this._error;
  }
}

module.exports = Result;
