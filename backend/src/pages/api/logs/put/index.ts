import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { getLoggedInUser } from "@/middlewares/auth";
import Logs, { LogType } from "@/models/Logs";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";
import { RateLimits } from "@/middlewares/rateLimit";

/**
 * ```
 * request = "POST /api/logs/put?type=(info|error|warn)" { timestamp: string, message: string }
 * response = { message: string }
 * ```
 */
export default withmiddleware(async function POST(req: NextApiRequest, res: NextApiResponse) {
  if (!(await RateLimits.LOG_WRITE(req, res))) return;

  // Only allow POST method
  if (req.method !== "POST") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  const uid = authResult.isSuccess() ? authResult.getUid() : "[NO_USER]";

  const type = req.query["type"] as LogType;
  if (!type) {
    throw CustomApiError.create(400, "Missing field 'type: info | error | warn'");
  }
  if (!["info", "error", "warn"].includes(type)) {
    throw CustomApiError.create(400, "Invalid field 'type: info | error | warn'");
  }

  const timestamp = req.body["timestamp"] as string;
  if (!timestamp) {
    throw CustomApiError.create(400, "Missing field 'timestamp: string'");
  }

  const message = req.body["message"] as string;
  if (!message) {
    throw CustomApiError.create(400, "Missing field 'message: string'");
  }

  await Logs.put(uid, { timestamp, message, type });
  return respond(res, { status: 200, message: `Log added on ${timestamp}` });
});
