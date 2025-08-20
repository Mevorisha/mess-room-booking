export class MultipleErrors extends Error {
  public errors: unknown[];

  constructor(errors: unknown[]) {
    super();
    this.name = "MultipleErrors"
    this.errors = errors;

    // Create a combined message for the Error object
    this.message = this.buildMessage();

    // Optional: set proper prototype chain (for instanceof checks)
    Object.setPrototypeOf(this, MultipleErrors.prototype);

    // Log the detailed errors to console.error
    console.error(this.toString());
  }

  private buildMessage(): string {
    return this.errors
      .map((err, index) => {
        let name = "UnknownError";
        let message = "";
        let stack = "";

        if (err instanceof Error) {
          name = err.name;
          message = err.message;
          stack = err.stack ?? "";
        } else if (typeof err === "string") {
          message = err;
        } else {
          try {
            message = JSON.stringify(err);
          } catch {
            message = String(err);
          }
        }

        return `[MultipleErrors:${index + 1}] ${name}: ${message}\n${stack}`;
      })
      .join("\n\n");
  }

  public override toString(): string {
    return this.message;
  }
}
