import { Unsafe } from "./utils";

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
   * const result = Result.err(new Error("Something went wrong"));
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
   * @throws {Error} if the result is `Err`
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
   * @throws {Error} if the result is `Ok`
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
   * Returns union of value if `Ok` or error otherwise. Very useful if you don't
   * want to extract inner members out of the Result due to aesthetic reasons.
   *
   * NOTE: Error type should be a `class` and NOT `interface` or `type`.
   *
   * ⚠️ UNSAFE: This requires using `instanceof` which IMO is lacking in type safety.
   * For example, if you get a `Unsafe<T|E>`, you can do `instanceof U` without issues
   * even though the returned value is either `T` or `E` and not `U`. Of course,
   * TS doesn't let you access the `T` unless `E` is handled.
   *
   * @example
   * ```ts
   * fnThatReturnsResult(): Result<MyValue, MyError>;
   *
   * const { UNSAFE: result }: Unsafe<MyValue | MyError> = fnThatReturnsResult().unwrap();
   *
   * if (result instanceof MyError) {
   *   // result is definitely of MyError type
   * } else  {
   *   // result is definitely of MyValue type
   * }
   * ```
   */
  unwrap(): Unsafe<T | E> {
    if (this.isOk) {
      return { UNSAFE: this.value };
    } else {
      return { UNSAFE: this.error };
    }
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
