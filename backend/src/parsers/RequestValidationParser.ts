import { NextApiRequest } from "next";
import { CustomApiError } from "@/types/CustomApiError";
import { z, ZodError } from "zod";
import { HttpMethodTypes } from "sharedtypes";

export class RequestValidationParser {
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
    method: HttpMethodTypes;
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
