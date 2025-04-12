import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { getLoggedInUser } from "@/middlewares/auth";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";
import { RateLimits } from "@/middlewares/rateLimit";
import Room, { SchemaFields } from "@/models/Room";

/**
 * ```
 * request = "DELETE /api/rooms/[roomId]/delete"
 * response = { message: string }
 * ```
 */
export default withmiddleware(async function DELETE(req: NextApiRequest, res: NextApiResponse) {
  // Only allow DELETE method
  if (req.method !== "DELETE") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  const roomId = req.query["roomId"] as string;
  if (!roomId) {
    throw CustomApiError.create(400, "Missing field 'roomId: string'");
  }

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  // Automatically throws ApiError and is caught by catchAll (middleware)
  const uid = authResult.getUid();

  if (!(await RateLimits.ROOM_DELETE(uid, req, res))) return;

  const roomData = await Room.get(roomId, "GS_PATH", [SchemaFields.OWNER_ID]);
  if (!roomData) {
    throw CustomApiError.create(404, "Room not found");
  }
  if (uid !== roomData?.ownerId) {
    throw CustomApiError.create(403, "Only owner can delete room");
  }

  const delInDays = await Room.markForDelete(roomId);
  return respond(res, { status: 200, message: `Room ${roomId} will be deleted in ${delInDays} days` });
});
