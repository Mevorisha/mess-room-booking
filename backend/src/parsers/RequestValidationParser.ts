import { NextApiRequest } from "next";
import { CustomApiError } from "@/types/CustomApiError";
import { z, ZodError } from "zod";

export type MethodTypes = "POST" | "GET" | "PATCH" | "DELETE";

export class RequestValidationParser {
  static readonly CommonSchema = {
    UID: z.string().nonempty(),
    IMAGE_SIZE: z.enum(["small", "medium", "large"]),
    OPTIONAL_BOOL: z.boolean().optional().default(false),
    DOC_VISIBILITY: z.enum(["PRIVATE", "PUBLIC"]).optional().default("PRIVATE"),
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
        throw CustomApiError.create(400, "Bad Request", error);
      }

      // Re-throw unexpected errors
      throw error;
    }
  }
}
