import type { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../lib/utils/respond.js";
import * as config from "../lib/config.js";

const AllowedOrigins: string[] = config.CORS_ALLOWED_ORIGINS;

const AllowedMethods = ["POST", "GET", "PATCH", "DELETE"];

const AllowedHeaders = ["Content-Type", "X-Firebase-Token"];

export async function cors(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const origin = req.headers.origin as string;
  if (AllowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    console.error(origin);
    respond(res, { status: 403, error: "Origin not allowed" });
    return false;
  }
  res.setHeader("Access-Control-Allow-Methods", AllowedMethods.join(", "));
  res.setHeader("Access-Control-Allow-Headers", AllowedHeaders.join(", "));
  // Coz we use "X-Firebase-Token" instead of cookies
  res.setHeader("Access-Control-Allow-Credentials", "false");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false;
  }

  return true;
}
