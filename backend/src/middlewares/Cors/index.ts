import type { NextApiRequest, NextApiResponse } from "next";
import * as config from "@/config/env";
import { CustomApiError } from "@/types/CustomApiError";
import { HeaderTypes } from "sharedtypes";
import { checkClientOrigin, AllowedHeaders, AllowedMethods, ExposedHeaders } from "./checkClientOrigin";

/**
 * @returns {boolean} True if response can be continued, false if response has been ended
 * @throws {CustomApiError} If CORS checks fail
 */
export async function cors(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  const { origin, allow } = checkClientOrigin(req);

  if (!allow) {
    throw CustomApiError.create(403, "Origin not allowed", origin);
  }

  if (config.IS_DEV) console.log("[I] [CORS] allowed origin:", origin);

  // patch: caches/CDNs may serve the wrong Access-Control-Allow-Origin to other clients
  res.setHeader("Vary", "Origin");

  res.setHeader(HeaderTypes.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
  res.setHeader(HeaderTypes.ACCESS_CONTROL_ALLOW_METHODS, AllowedMethods.join(", "));
  res.setHeader(HeaderTypes.ACCESS_CONTROL_ALLOW_HEADERS, AllowedHeaders.join(", "));
  res.setHeader(HeaderTypes.ACCESS_CONTROL_EXPOSE_HEADERS, ExposedHeaders.join(", "));

  // Coz we use "X-Firebase-Token" instead of cookies
  res.setHeader(HeaderTypes.ACCESS_CONTROL_ALLOW_CREDENTIALS, "false");

  if (req.method === "OPTIONS") {
    res.status(204);
    res.end();
    return Promise.resolve(false);
  }

  // Not to end response here and let it be end by handler
  return Promise.resolve(true);
}
