import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { getLoggedInUser } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import Room, { SchemaFields } from "@/models/Room";

/**
 * ```
 * request = "DELETE /api/rooms/[roomId]/delete?force=true|false"
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function DELETE(req: NextApiRequest, res: NextApiResponse) {
  // Only allow DELETE method
  if (req.method !== "DELETE") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  const roomId = req.query["roomId"] as string;
  if (!roomId) {
    throw CustomApiError.create(400, "Missing field 'roomId: string'");
  }

  const forceDelete = req.query["force"] === "true" ? true : false;

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

  if (forceDelete) {
    await Room.forceDelete(roomId);
    return respond(res, { status: 200, message: `Room ${roomId} frocefully deleted` });
  } else {
    const delInDays = await Room.markForDelete(roomId);
    return respond(res, { status: 200, message: `Room ${roomId} will be deleted in ${delInDays} days` });
  }
});
