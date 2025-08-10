import { NextApiRequest } from "next";
import { CustomApiError } from "@/types/CustomApiError";
import { z, ZodError } from "zod";

export type MethodTypes = "POST" | "GET" | "PATCH" | "DELETE";

export class RequestValidationParser {
  static readonly CommonSchema = {
    UID: z.string({ error: "UID should be a string" }).nonempty({ error: "UID cannot be empty" }),

    OPTIONAL_BOOL: z.boolean({ error: "b64 flag should be boolean" }).optional().default(false),

    IMAGE_SIZE: z.enum(["small", "medium", "large"], { error: "Image size should be 'small', 'medium' or 'large'" }),

    DOC_VISIBILITY: z
      .enum(["PRIVATE", "PUBLIC"], { error: "Visibility should be 'PRIVATE' or 'PUBLIC'" })
      .optional()
      .default("PRIVATE"),
  };

  /**
   * Parses and validates query parameters from a Next.js API request
   * @param req - The Next.js API request object
   * @param schema - Zod schema to validate against
   * @returns Parsed and validated query parameters
   * @throws CustomApiError if validation fails
   */
  static parse<T extends z.ZodSchema>({
    req,
    method,
    validation,
  }: {
    req: NextApiRequest;
    method: MethodTypes;
    validation: T;
  }): z.infer<T> {
    if (req.method !== method) {
      throw CustomApiError.create(405, "Method Not Allowed");
    }

    try {
      // Parse the query parameters with the provided schema
      return validation.parse(req.query) as z.infer<T>;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.message;
        throw CustomApiError.create(400, `Invalid request: ${errorMessages}`);
      }

      // Re-throw unexpected errors
      throw error;
    }
  }
}
