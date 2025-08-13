import { NextApiRequest } from "next";
import { CustomApiError } from "@/types/CustomApiError";
import { z, ZodError } from "zod";

export type MethodTypes = "POST" | "GET" | "PATCH" | "DELETE";

export class RequestValidationParser {
  static readonly CommonSchema = {
    UID: z.string().nonempty(),
    IMAGE_SIZE: z.enum(["small", "medium", "large"]),
    LOG_TYPE: z.enum(["info", "warn", "error"]),
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
    params,
  }: {
    req: NextApiRequest;
    method: MethodTypes;
    params?: T;
  }): z.infer<T> {
    if (req.method !== method) {
      throw CustomApiError.create(405, "Method Not Allowed");
    }

    try {
      if (params == null) {
        return z.object({}).parse(req.query) as z.infer<T>;
      }
      // Parse the query parameters with the provided schema
      return params.parse(req.query) as z.infer<T>;
    } catch (e) {
      if (e instanceof ZodError) {
        throw CustomApiError.create(400, "Bad Request", e);
      }

      // Re-throw unexpected errors
      throw e;
    }
  }
}
