import { ValidationError } from "class-validator";

export class DtoValidationError extends Error {
  readonly apiStatusCode: number = 400;

  constructor(error: ValidationError[] | { apiStatusCode?: number; message: string }) {
    super();
    this.name = "DtoValidationError";

    if (!(error instanceof Array)) {
      this.message = error.message;
      if (error.apiStatusCode != null) {
        this.apiStatusCode = error.apiStatusCode;
      }
    } else {
      this.message = DtoValidationError.formatMessage(error);
    }
  }

  private static formatMessage(errors: ValidationError[]): string {
    const messages: string[] = [];

    for (const error of errors) {
      if (error.constraints == null) {
        continue; // skip if no constraints present
      }

      const property = error.property;
      const constraints = Object.values(error.constraints);

      for (const constraint of constraints) {
        if (constraint.length > 0 && constraint.length > 0) {
          if (constraint.startsWith("Invalid")) {
            // Full custom message
            messages.push(constraint);
          } else {
            // Our formatted message
            messages.push(`Invalid '${property}'. ${constraint}`);
          }
        } else {
          messages.push(`Invalid '${property}'`);
        }
      }
    }

    return messages.join("\n");
  }
}
