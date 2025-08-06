import { ValidationError } from "class-validator";

export default class DtoValidationError extends Error {
  public readonly validationErrors: ValidationError[];

  constructor(validationErrors: ValidationError[]) {
    super(DtoValidationError.formatErrors(validationErrors));
    this.name = "DtoValidationError";
    this.validationErrors = validationErrors;

    // Ensure instanceof works properly
    Object.setPrototypeOf(this, new.target.prototype);
  }

  private static formatErrors(errors: ValidationError[], parentPath = ""): string {
    const messages: string[] = [];

    for (const error of errors) {
      const propertyPath = parentPath.length > 0 ? `${parentPath}.${error.property}` : error.property;

      if (error.constraints != null) {
        for (const [_, msg] of Object.entries(error.constraints)) {
          messages.push(`${propertyPath}: ${msg}`);
        }
      }

      if (error.children != null && error.children.length > 0) {
        messages.push(this.formatErrors(error.children, propertyPath));
      }
    }

    return messages.join("\n");
  }
}
