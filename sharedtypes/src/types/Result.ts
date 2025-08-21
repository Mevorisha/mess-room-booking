/**
 * A result type that represents either a success (`Ok`) or a failure (`Err`).
 * Similar to Rust's Result or functional languages' Either.
 *
 * @template T The success value type.
 * @template E The error type, must extend `Error`.
 */
export class Result<T, E extends Error> {
  private constructor(private readonly _isOk: boolean, private readonly _value?: T, private readonly _error?: E) {}

  /**
   * Creates a successful result.
   *
   * @example
   * ```ts
   * const result = Result.ok(123);
   * if (result.isOk) {
   *   console.log(result.value); // 123
   * }
   * ```
   */
  static ok<T, E extends Error = never>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  /**
   * Creates a failed result.
   *
   * @example
   * ```ts
   * const error = new Error("Something went wrong");
   * const result = Result.err(error);
   * if (result.isErr) {
   *   console.error(result.error.message); // "Something went wrong"
   * }
   * ```
   */
  static err<T = never, E extends Error = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  /**
   * Returns true if the result is `Ok`.
   */
  get isOk(): boolean {
    return this._isOk;
  }

  /**
   * Returns true if the result is `Err`.
   */
  get isErr(): boolean {
    return !this._isOk;
  }

  /**
   * Returns the success value, or throws if the result is an error.
   *
   * @throws if the result is `Err`
   * @example
   * ```ts
   * const result = Result.ok(42);
   * console.log(result.value); // 42
   * ```
   */
  get value(): T {
    if (!this._isOk) {
      throw new Error("Tried to access value of an Err result");
    }
    return this._value as T;
  }

  /**
   * Returns the error, or throws if the result is a success.
   *
   * @throws if the result is `Ok`
   * @example
   * ```ts
   * const result = Result.err(new Error("Oops"));
   * console.error(result.error.message); // "Oops"
   * ```
   */
  get error(): E {
    if (this._isOk) {
      throw new Error("Tried to access error of an Ok result");
    }
    return this._error as E;
  }

  /**
   * Maps the success value to a new result.
   *
   * @example
   * ```ts
   * const result = Result.ok(2).map(x => x * 3); // Ok(6)
   * ```
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    return this.isOk ? Result.ok<U, E>(fn(this.value)) : Result.err<U, E>(this.error);
  }

  /**
   * Maps the error to a new error type.
   *
   * @example
   * ```ts
   * class CustomError extends Error {}
   * const result = Result.err(new Error("fail")).mapErr(
   *   err => new CustomError(err.message)
   * );
   * ```
   */
  mapErr<F extends Error>(fn: (error: E) => F): Result<T, F> {
    return this.isErr ? Result.err<T, F>(fn(this.error)) : Result.ok<T, F>(this.value);
  }

  /**
   * Returns the value if `Ok`, otherwise throws the contained error
   * @throws {E} The contained error
   *
   * @example
   * ```ts
   * const value = Result.err(new Error("fail")).unwrapOrDie();
   * ```
   */
  unwrapOrDie(): T {
    if (this.isErr) {
      throw this.error;
    }
    return this.value;
  }

  /**
   * Returns the value if `Ok`, otherwise returns the provided default.
   *
   * @example
   * ```ts
   * const value = Result.err(new Error("fail")).unwrapOr(10); // 10
   * ```
   */
  unwrapOr(defaultValue: T): T {
    return this.isOk ? this.value : defaultValue;
  }

  /**
   * Converts the result to a Promise. Resolves if `Ok`, rejects if `Err`.
   *
   * @example
   * ```ts
   * const result = Result.ok("data");
   * await result.toPromise(); // resolves with "data"
   *
   * const errResult = Result.err(new Error("fail"));
   * await errResult.toPromise(); // throws "fail"
   * ```
   */
  async toPromise(): Promise<T> {
    if (this.isOk) {
      return Promise.resolve(this.value);
    }
    return Promise.reject(this.error);
  }
}
