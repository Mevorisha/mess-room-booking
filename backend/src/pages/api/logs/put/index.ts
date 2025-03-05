import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { getLoggedInUser } from "@/middlewares/auth";
import Logs, { LogType } from "@/models/Logs";
import { withmiddleware } from "@/middlewares/withMiddleware";

/**
 * ```
 * request = "POST /api/logs/put?type=(info|error|warn)" { timestamp: string, message: string }
 * response = { message: string }
 * ```
 */
export default withmiddleware(async function POST(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== "POST") {
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }

  // Auth middleware to get user
  const uid = (await getLoggedInUser(req, res)) || "[NO_USER]";

  const type = req.query["type"] as LogType;
  if (!type) {
    return respond(res, { status: 400, error: "Missing field 'type: info | error | warn'" });
  }
  if (!["info", "error", "warn"].includes(type)) {
    return respond(res, { status: 400, error: "Invalid field 'type: info | error | warn'" });
  }

  const timestamp = req.body["timestamp"] as string;
  if (!timestamp) {
    return respond(res, { status: 400, error: "Missing field 'timestamp: string'" });
  }

  const message = req.body["message"] as string;
  if (!message) {
    return respond(res, { status: 400, error: "Missing field 'message: string'" });
  }

  await Logs.put(uid, { timestamp, message, type });
  return respond(res, { status: 200, message: `Log added on ${timestamp}` });
});
