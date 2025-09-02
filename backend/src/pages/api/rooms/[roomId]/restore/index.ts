import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { getLoggedInUser } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { RoomRepo } from "@/repo/RoomRepo";
import { ApiResponseUrlType, HttpMethodTypes } from "sharedtypes";
import { RoomService } from "@/services/Room/RoomService";

/**
 * ```
 * request = "PATCH /api/rooms/[roomId]/restore"
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  const { roomId } = RequestValidationParser.parse({
    req,
    method: HttpMethodTypes.PATCH,
    params: z.object({ roomId: CommonZodSchemas.Basic.UID }),
  });

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  // Automatically throws ApiError and is caught by catchAll (middleware)
  const uid = authResult.getUid();

  if (!(await RateLimits.ROOM_RESTORE(uid, req, res))) return;

  const roomDto = await RoomRepo.findById(roomId, ApiResponseUrlType.GS_PATH);
  if (roomDto == null) {
    throw CustomApiError.create(404, "Room not found");
  }
  if (uid !== roomDto.ownerId) {
    throw CustomApiError.create(403, "Only owner can restore room");
  }

  await RoomService.unmarkForDelete(roomId);
  return respond(res, { status: 200, message: `Room ${roomId} is restored` });
});
