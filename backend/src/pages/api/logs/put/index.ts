import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { getLoggedInUser } from "@/middlewares/auth";
import Logs, { LogType } from "@/models/Logs";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";

/**
 * ```
 * request = "POST /api/logs/put?type=(info|error|warn)" { timestamp: string, message: string }
 * response = { message: string }
 * ```
 */
export default withmiddleware(async function POST(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== "POST") {
    throw new CustomApiError(405, "Method Not Allowed");
  }

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  const uid = authResult.isSuccess() ? authResult.getUid() : "[NO_USER]";

  const type = req.query["type"] as LogType;
  if (!type) {
    throw new CustomApiError(400, "Missing field 'type: info | error | warn'");
  }
  if (!["info", "error", "warn"].includes(type)) {
    throw new CustomApiError(400, "Invalid field 'type: info | error | warn'");
  }

  const timestamp = req.body["timestamp"] as string;
  if (!timestamp) {
    throw new CustomApiError(400, "Missing field 'timestamp: string'");
  }

  const message = req.body["message"] as string;
  if (!message) {
    throw new CustomApiError(400, "Missing field 'message: string'");
  }

  await Logs.put(uid, { timestamp, message, type });
  return respond(res, { status: 200, message: `Log added on ${timestamp}` });
});
