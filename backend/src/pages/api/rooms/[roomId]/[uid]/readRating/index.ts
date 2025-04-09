import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";
import RoomRatings from "@/models/RoomRatings";
import { getLoggedInUser } from "@/middlewares/auth";
import Room, { SchemaFields } from "@/models/Room";

/**
 * ```
 * request = "GET /api/rooms/[roomId]/[uid]/readRating"
 * response = { rating: 1|2|3|4|5 }
 * ```
 */
export default withmiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  const roomId = req.query["roomId"] as string;
  if (!roomId) {
    throw CustomApiError.create(400, "Missing field 'roomId: string'");
  }

  // Require authentication middleware
  const authResult = await getLoggedInUser(req);
  const uid = authResult.getUid();

  const { ownerId } = await Room.get(roomId, "GS_PATH", [SchemaFields.OWNER_ID]);
  if (ownerId === uid) {
    throw CustomApiError.create(403, "Owner never rates their own room");
  }

  if (uid !== (req.query["uid"] as string)) {
    throw CustomApiError.create(401, "Unauthorized");
  }

  const rating = (await RoomRatings.get(uid, roomId)) ?? 0;
  return respond(res, { status: 200, json: { rating } });
});
