import type { NextApiRequest, NextApiResponse } from "next";
import * as config from "@/lib/config";
import { CustomApiError } from "@/lib/utils/ApiError";
import HeaderTypes from "@/lib/utils/HeaderTypes";

const AllowedOrigins: string[] = config.CORS_ALLOWED_ORIGINS;
const AllowedMethods = ["POST", "GET", "PATCH", "DELETE"];
const AllowedHeaders = [HeaderTypes.CONTENT_TYPE, HeaderTypes.X_FIREBASE_TOKEN];
const ExposedHeaders = [HeaderTypes.X_CONTENT_ENCODING, HeaderTypes.X_DECODED_CONTENT_TYPE];

/**
 * @returns {boolean} True if response can be continued, false if response has been ended
 * @throws {CustomApiError} If CORS checks fail
 */
export async function cors(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  const origin = req.headers.origin || ("" as string);
  if (
    config.CORS_ALLOW_EVERYTHING ||
    AllowedOrigins.includes(origin) ||
    /mess-booking-app-serverless-[a-z0-9\-]+.web.app/.test(origin)
  ) {
    console.log("[I] [CORS] allowed origin:", origin);
    res.setHeader(HeaderTypes.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
  } else {
    if (origin) console.error("[E] [CORS] blocked origin:", origin);
    else console.error("[E] [CORS] no origin header found");
    throw CustomApiError.create(403, "Origin not allowed");
  }
  res.setHeader(HeaderTypes.ACCESS_CONTROL_ALLOW_METHODS, AllowedMethods.join(", "));
  res.setHeader(HeaderTypes.ACCESS_CONTROL_ALLOW_HEADERS, AllowedHeaders.join(", "));
  res.setHeader(HeaderTypes.ACCESS_CONTROL_EXPOSE_HEADERS, ExposedHeaders.join(", "));
  // Coz we use "X-Firebase-Token" instead of cookies
  res.setHeader(HeaderTypes.ACCESS_CONTROL_ALLOW_CREDENTIALS, "false");

  if (req.method === "OPTIONS") {
    res.status(204);
    res.end();
    return false;
  }

  // Not to end response here and let it be end by handler
  return true;
}
