import { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../modules/utils/respond.js";

/**
 * ```
 * request = "GET /"
 *
 * response = {
 *   message: "Hello World!"
 * }
 * ```
 */
export default async function GET(req: VercelRequest, res: VercelResponse) {
  return respond(res, { status: 200, message: "Hello World!" });
}
