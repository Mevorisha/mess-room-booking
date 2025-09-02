import * as config from "@/config/env";
import { CustomApiError } from "@/types/CustomApiError";
import { NextApiRequest } from "next";
import { HeaderTypes, HttpMethodTypes } from "sharedtypes";

export const AllowedOrigins: string[] = [...config.ALLOWED_ORIGINS];
export const AllowedMethods = [
  HttpMethodTypes.POST,
  HttpMethodTypes.GET,
  HttpMethodTypes.PATCH,
  HttpMethodTypes.DELETE,
];
export const AllowedHeaders = [HeaderTypes.CONTENT_TYPE, HeaderTypes.X_FIREBASE_TOKEN];
export const ExposedHeaders = [HeaderTypes.X_CONTENT_ENCODING, HeaderTypes.X_DECODED_CONTENT_TYPE];

/**
 * @returns {boolean} True if client is to be allowed
 * @throws {CustomApiError} If origin is null or invalid
 */
export function checkClientOrigin(req: NextApiRequest): { origin: string; allow: boolean } {
  let origin = req.headers.origin;

  if (origin == null) {
    throw CustomApiError.create(400, "Missing origin URL");
  }

  // normalization
  try {
    origin = new URL(origin).origin;
  } catch (e) {
    const error = e as { code?: string };
    if (error.code === "ERR_INVALID_URL") {
      throw CustomApiError.create(400, "Invalid origin URL", origin);
    } else {
      throw CustomApiError.create(500, "Internal Server Error", e);
    }
  }

  if (
    // if dev/preview env is setup, all origins are allowed
    config.ALLOW_ANY_ORIGIN ||
    // otherwise, if whitelist allows
    AllowedOrigins.includes(origin) ||
    // otherwise if firebase preview deployment
    /^https:\/\/mess-booking-app-serverless-[a-z0-9-]+\.web\.app$/.test(origin)
  ) {
    return { origin, allow: true };
  } else {
    return { origin, allow: false };
  }
}
