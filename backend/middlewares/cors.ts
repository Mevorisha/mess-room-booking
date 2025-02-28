import type { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../lib/utils/respond.js";

const AllowedOrigins = [
  "mess-booking-app-serverless.web.app",
  "mess-booking-app-serverless.firebaseapp.com",
  "mess-booking-app-serverless.vercel.app",
];

const AllowedMethods = ["POST", "GET", "PATCH", "DELETE"];

const AllowedHeaders = ["Content-Type", "X-Firebase-Token"];

export async function cors(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const origin = req.headers.origin as string;
  if (AllowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
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
