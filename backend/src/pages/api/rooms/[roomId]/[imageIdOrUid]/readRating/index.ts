import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import RoomRatings from "@/models/RoomRatings";
import { getLoggedInUser } from "@/middlewares/Auth";
import Room, { SchemaFields } from "@/models/Room";
import { RateLimits } from "@/middlewares/RateLimiter";

/**
 * ```
 * request = "GET /api/rooms/[roomId]/[imageIdOrUid]/readRating"
 * response = { rating: 0|1|2|3|4|5 }
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET method
  if (req.method !== "GET") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  const roomId = req.query["roomId"] as string;
  if (!roomId) {
    throw CustomApiError.create(400, "Missing field 'roomId: string'");
  }

  // Require authentication middleware
  const authResult = await getLoggedInUser(req);
  const uid = authResult.getUid();

  if (!(await RateLimits.ROOM_CLIENT_RATING_READ(uid, req, res))) return;

  const roomData = await Room.get(roomId, "GS_PATH", [SchemaFields.OWNER_ID]);
  if (!roomData) {
    throw CustomApiError.create(404, "Room not found");
  }
  if (roomData.ownerId === uid) {
    throw CustomApiError.create(403, "Owner never rates their own room");
  }

  const uidFromQuery = req.query["imageIdOrUid"] as string;
  if (!uidFromQuery) {
    throw CustomApiError.create(400, "Missing field 'imageIdOrUid: string'");
  }

  if (uid !== uidFromQuery) {
    throw CustomApiError.create(401, "Unauthorized");
  }

  const rating = (await RoomRatings.get(uid, roomId)) ?? 0;
  return respond(res, { status: 200, json: { rating } });
});
