import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { authenticate } from "@/middlewares/auth";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";
import { RateLimits } from "@/middlewares/rateLimit";
import Room, { SchemaFields } from "@/models/Room";

/**
 * ```
 * request = "PATCH /api/rooms/[roomId]/restore"
 * response = { message: string }
 * ```
 */
export default withmiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  const uid = req.query["uid"] as string;
  if (!uid) {
    throw CustomApiError.create(400, "Missing field 'uid: string'");
  }
  const roomId = req.query["roomId"] as string;
  if (!roomId) {
    throw CustomApiError.create(400, "Missing field 'roomId: string'");
  }
  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.ROOM_RESTORE(uid, req, res))) return;

  const roomData = await Room.get(roomId, "GS_PATH", [SchemaFields.OWNER_ID]);
  if (!roomData) {
    throw CustomApiError.create(404, "Room not found");
  }
  if (uid !== roomData?.ownerId) {
    throw CustomApiError.create(403, "Only owner can restore room");
  }

  await Room.unmarkForDelete(roomId);
  return respond(res, { status: 200, message: `Room ${roomId} is restored` });
});
