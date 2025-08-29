# Mess Booking App

- CRA dev server @ :3000
- Vercel dev server @ :3001
- Firebase emulator @ 9XXX (If needed)

## Exception Handling & Documentation Guidelines (TypeScript)

### 1. Functions

- **All functions that `throw` must include `@throws` in their JSDoc**.
- Prefer avoid `throw` and instead return `Result<T, E1 | E2 | E3 |...>`.
- Clearly specify all possible exceptions.
- Example:

```ts
/**
 * Parses a JSON string into an object.
 *
 * @param input - The JSON string to parse.
 * @throws {SyntaxError} If the input is not valid JSON.
 */
function parseJson(input: string): object {
  return JSON.parse(input);
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
    if (age < 0)     throw new ValidationError("Age cannot be negative");
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
  ):
    Result<User, ValidationError | MoreError>
  {
    try {
      return Result.ok(new User(name, age));
    } catch (e) {
      return Result.err(e as ValidationError | MoreError);
    }
  }
}
```
