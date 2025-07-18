import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { getLoggedInUser } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import Room, { SchemaFields } from "@/models/Room";

/**
 * ```
 * request = "PATCH /api/rooms/[roomId]/updateUnavailability" { isUnavailable: boolean }
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  const roomId = req.query["roomId"] as string;
  if (!roomId) {
    throw CustomApiError.create(400, "Missing field 'roomId: string'");
  }

  const _isUnavailable = req.body.isUnavailable;
  if (_isUnavailable === void 0 || _isUnavailable === null) {
    throw CustomApiError.create(400, "Missing field 'isUnavailable: boolean'");
  }
  if (!["true", "false", true, false].includes(_isUnavailable)) {
    throw CustomApiError.create(400, "Invalid field 'isUnavailable: boolean'");
  }
  const isUnavailable = _isUnavailable === "true" ? true : false;

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
    throw CustomApiError.create(403, "Only owner can set room unavailability");
  }

  await Room.setUnavailability(roomId, isUnavailable);
  return respond(res, { status: 200, message: `Room ${roomId} marked ${isUnavailable ? "unavailable" : "available"}` });
});
