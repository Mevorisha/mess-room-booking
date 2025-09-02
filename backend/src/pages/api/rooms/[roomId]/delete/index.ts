import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { getLoggedInUser } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { RoomRepo } from "@/repo/RoomRepo";
import { ApiResponseUrlType, HttpMethodTypes } from "sharedtypes";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";
import { RoomService } from "@/services/Room/RoomService";

/**
 * ```
 * request = "DELETE /api/rooms/[roomId]/delete?force=true|false"
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function DELETE(req: NextApiRequest, res: NextApiResponse) {
  const { roomId, force: forceDelete = false } = RequestValidationParser.parse({
    req,
    method: HttpMethodTypes.DELETE,
    params: z.object({
      roomId: CommonZodSchemas.Basic.UID,
      force: CommonZodSchemas.QueryParam.OPTIONAL_BOOL,
    }),
  });

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  // Automatically throws ApiError and is caught by catchAll (middleware)
  const uid = authResult.getUid();

  if (!(await RateLimits.ROOM_DELETE(uid, req, res))) return;

  const roomData = await RoomRepo.findById(roomId, ApiResponseUrlType.GS_PATH);
  if (roomData == null) {
    throw CustomApiError.create(404, "Room not found");
  }
  if (uid !== roomData.ownerId) {
    throw CustomApiError.create(403, "Only owner can delete room");
  }

  if (forceDelete) {
    await RoomService.forceDelete(roomId);
    return respond(res, { status: 200, message: `Room ${roomId} frocefully deleted` });
  } else {
    const delInDays = await RoomService.markForDelete(roomId);
    return respond(res, { status: 200, message: `Room ${roomId} will be deleted in ${delInDays} days` });
  }
});
