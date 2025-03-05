import type { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import * as config from "@/lib/config";

const AllowedOrigins: string[] = config.CORS_ALLOWED_ORIGINS;

const AllowedMethods = ["POST", "GET", "PATCH", "DELETE"];

const AllowedHeaders = ["Content-Type", "X-Firebase-Token"];

export async function cors(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  const origin = req.headers.origin as string;
  if (AllowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    if (origin) console.error("Blocked origin:", origin);
    else console.log("No origin header found");
    respond(res, { status: 403, error: "Origin not allowed" });
    return false;
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
