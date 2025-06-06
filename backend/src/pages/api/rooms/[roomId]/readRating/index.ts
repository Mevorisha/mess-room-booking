import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import Room, { SchemaFields } from "@/models/Room";
import { RateLimits } from "@/middlewares/RateLimiter";

/**
 * ```
 * request = "GET /api/rooms/[roomId]/readRating"
 * response = { rating: 0|1|2|3|4|5 }
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (!(await RateLimits.ROOM_RATING_READ(req, res))) return;

  // Only allow GET method
  if (req.method !== "GET") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  const roomId = req.query["roomId"] as string;
  if (!roomId) {
    throw CustomApiError.create(400, "Missing field 'roomId: string'");
  }

  const roomData = await Room.get(roomId, "GS_PATH", [SchemaFields.RATING]);
  if (!roomData) {
    throw CustomApiError.create(404, "Room not found");
  }
  return respond(res, { status: 200, json: { rating: roomData.rating ?? 0 } });
});
