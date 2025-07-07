import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { cors } from "@/middlewares/Cors";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
// import { CustomApiError } from "@/types/CustomApiError";

/**
 * ```
 * request = "GET /api"
 *
 * response = {
 *   message: "Hello World!"
 * }
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (!(await cors(req, res))) return;
  // throw new CustomApiError(500, "My shit is hot")
  return respond(res, { status: 200, message: "Hello World!" });
});
