import type { NextApiRequest, NextApiResponse } from "next";
import * as config from "@/lib/config";
import { CustomApiError } from "@/lib/utils/ApiError";

const AllowedOrigins: string[] = config.CORS_ALLOWED_ORIGINS;

const AllowedMethods = ["POST", "GET", "PATCH", "DELETE"];

const AllowedHeaders = ["Content-Type", "X-Firebase-Token"];

/**
 * @returns {boolean} True if response can be continued, false if response has been ended
 * @throws {CustomApiError} If CORS checks fail
 */
export async function cors(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  const origin = req.headers.origin as string;
  if (AllowedOrigins.includes(origin) || /mess-booking-app-serverless-[a-z0-9\-]+.web.app/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    if (origin) console.error("Blocked origin:", origin);
    else console.error("No origin header found");
    throw CustomApiError.create(403, "Origin not allowed");
  }
  res.setHeader("Access-Control-Allow-Methods", AllowedMethods.join(", "));
  res.setHeader("Access-Control-Allow-Headers", AllowedHeaders.join(", "));
  // Coz we use "X-Firebase-Token" instead of cookies
  res.setHeader("Access-Control-Allow-Credentials", "false");

  if (req.method === "OPTIONS") {
    res.status(204);
    res.end();
    return false;
  }

  // Not to end response here and let it be end by handler
  return true;
}
