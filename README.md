# Mess Booking App

- CRA dev server @ :3000
- Vercel dev server @ :3001
- Firebase emulator @ 9XXX (If needed)

## Exception Handling & Documentation Guidelines (TypeScript)

### 1. Functions

- **All functions that use `throw` keyword must include `@throws` in their JSDoc**.
- Prefer avoid `throw` and instead return `Result<T, E1 | E2 | E3 |...>` for all functions.
- For `async` functions, one may return rejected promise instead of encapsulating the Result in promise.
  - If your function is a callback to a framework or something, use rejection.
  - If the function is called by you, eventually refactor to `Promise<Result<T,E>>`.
- Example:

#### DISCOURAGED

You can still use `throw` if absolutely necessary but make sure the JSDoc contains `@throws`.

```ts
/**
 * Parses a JSON string into an object.
 * Doesn't return a Result<object, SyntaxError> for whatever reason.
 *
 * @throws {SyntaxError} If the input is not valid JSON.
 */
function parseJson(input: string): object {
  return JSON.parse(input);
}
```

#### BETTER

This forces the caller to handle the error or explicitly have it thrown.

```ts
/**
 * Parses a JSON string into an object.
 */
function parseJson(input: string): Result<object, SyntaxError> {
  try {
    return Result.ok(JSON.parse(input));
  } catch (e) {
    return Result.err(e as Error);
  }
}
```

### 2. Constructors

- Constructors cannot return `Result<T, E>` so you have to throw.
- Use a **static method** that calls constructor and converts caught errors into a `Result`.
- Make the constructor `private` or `protected`, not `public` or default.

Example:

```ts
class User {
  public readonly name: string;
  public readonly age: number;

  /**
   * @throws {ValidationError | MoreError}
   */
  private constructor(name: string, age: number) {
    if (name === "") throw new ValidationError("Name is required");
    if (age < 0) throw new ValidationError("Age cannot be negative");
    Something.someFunctionFoo({ name, age }); // throws MoreError (u gotta know this)
    this.name = name;
    this.age = age;
  }

  /**
   * Creates a new User instance after validating inputs.
   * @param name - The user’s name.
   * @param age - The user’s age.
   */
  static create(
    name: string,
    age: number
  ): Result<User, ValidationError | MoreError> {
    try {
      return Result.ok(new User(name, age));
    } catch (e) {
      return Result.err(e as ValidationError | MoreError);
    }
  }
}
```

### 3. Result Type

- Do NOT handle `result.error` in async functions if you want to signal failure down the promise chain.
- Instead use `result.unwrapOrThrow()` to fail automatically if result is `Err`.
- Alternatively, use `return Promise.reject(result.error)`.

#### INCORRECT

```ts
await fetch(...)
  .then((response) => processResponse(response))
  .then((result) => {
    if (response.isErr) {
      notify(response.error, "error");
      // Promise resolved: signals success
      return;
    }
    // Not executed as returned early
    await useValue(result.value);
  })
  .then(() => notify("Success Message!", "sucess"))
  .catch((e: Error) => notify(e, "error"));

// The above on `processResponse` failure also displays "Success Message!"
```

#### BETTER

```ts
await fetch(...)
  .then((response) => processResponse(response).unwrapOrThrow())
  .then((resultValue) => await useValue(resultValue))
  .then(() => notify("Success Message!", "sucess"))
  .catch((e: Error) => notify(e, "error"));

// The above on `processResponse` failure triggers the catch handler
```
