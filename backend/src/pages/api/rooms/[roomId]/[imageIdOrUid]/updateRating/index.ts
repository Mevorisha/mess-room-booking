import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";
import RoomRatings from "@/models/RoomRatings";
import { getLoggedInUser } from "@/middlewares/auth";
import Room, { SchemaFields } from "@/models/Room";
import { RateLimits } from "@/middlewares/rateLimit";

/**
 * ```
 * request = "PATCH /api/rooms/[roomId]/[imageIdOrUid]/updateRating" {
 *   rating: 1|2|3|4|5
 * }
 * response = { message: string }
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

  if (!(await RateLimits.ROOM_CLIENT_RATING_UPDATE(uid, req, res))) return;

  const { ownerId } = await Room.get(roomId, "GS_PATH", [SchemaFields.OWNER_ID]);
  if (ownerId === uid) {
    throw CustomApiError.create(403, "Owner cannot rate their own room");
  }

  const uidFromQuery = req.query["imageIdOrUid"] as string;
  if (!uidFromQuery) {
    throw CustomApiError.create(400, "Missing field 'imageIdOrUid: string'");
  }

  if (uid !== uidFromQuery) {
    throw CustomApiError.create(401, "Unauthorized");
  }

  let rating = req.body["rating"];
  if (!rating) {
    throw CustomApiError.create(400, "Missing field 'rating: 1 | 2 | 3 | 4 | 5'");
  }
  if (rating < 1 || rating > 5) {
    throw CustomApiError.create(400, "Invalid field 'rating: 1 | 2 | 3 | 4 | 5'");
  }
  rating = Math.floor(Number(rating));

  await RoomRatings.set(uid, roomId, rating);
  return respond(res, { status: 200, message: `Rating for room ${roomId} updated` });
});
