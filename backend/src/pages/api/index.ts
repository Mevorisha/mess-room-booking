import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";

/**
 * ```
 * request = "GET /"
 *
 * response = {
 *   message: "Hello World!"
 * }
 * ```
 */
export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  return respond(res, { status: 200, message: "Hello World!" });
}
