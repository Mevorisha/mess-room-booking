import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";

/**
 * ```
 * request = "GET /api"
 *
 * response = {
 *   message: "Hello World!"
 * }
 * ```
 */
export default async function GET(_req: NextApiRequest, res: NextApiResponse) {
  return respond(res, { status: 200, message: "Hello World!" });
}
