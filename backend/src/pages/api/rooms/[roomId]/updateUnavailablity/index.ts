import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { getLoggedInUser } from "@/middlewares/auth";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";
import { RateLimits } from "@/middlewares/rateLimit";
import Room, { SchemaFields } from "@/models/Room";

/**
 * ```
 * request = "PATCH /api/rooms/[roomId]/updateUnavailablity" { isUnavailable: boolean }
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

  const isUnavailable = Boolean(req.body["isUnavailable"]);
  if (!isUnavailable) {
    throw CustomApiError.create(400, "Missing field 'isUnavailable: boolean'");
  }

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  // Automatically throws ApiError and is caught by catchAll (middleware)
  const uid = authResult.getUid();

  if (!(await RateLimits.ROOM_UNAVAILABLITY_UPDATE(uid, req, res))) return;

  const roomData = await Room.get(roomId, "GS_PATH", [SchemaFields.OWNER_ID]);
  if (!roomData) {
    throw CustomApiError.create(404, "Room not found");
  }
  if (uid !== roomData?.ownerId) {
    throw CustomApiError.create(403, "Only owner can set room unavailablity");
  }

  await Room.setUnavailablity(roomId, isUnavailable);
  return respond(res, { status: 200, message: `Room ${roomId} marked ${isUnavailable ? "unavailable" : "available"}` });
});
