import { ValidationError } from "class-validator";

export default class DtoValidationError extends Error {
  public readonly validationErrors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super(DtoValidationError.formatMessage(errors));
    this.name = "DtoValidationError";
    this.validationErrors = errors;
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
