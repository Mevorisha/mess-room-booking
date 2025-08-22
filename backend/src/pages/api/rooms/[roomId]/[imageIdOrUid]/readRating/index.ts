import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { getLoggedInUser } from "@/middlewares/Auth";
import { RateLimits } from "@/middlewares/RateLimiter";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { RoomRepo } from "@/repo/RoomRepo";
import { ApiResponseUrlType, HttpMethodTypes } from "sharedtypes";
import { RoomRatingsService } from "@/services/Room/RoomRatingsService";

/**
 * ```
 * request = "GET /api/rooms/[roomId]/[imageIdOrUid]/readRating"
 * response = { rating: 0|1|2|3|4|5 }
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Extract query params from request
  const { roomId, imageIdOrUid: uidFromQuery } = RequestValidationParser.parse({
    req,
    method: HttpMethodTypes.GET,
    params: z.object({
      roomId: CommonZodSchemas.Basic.UID,
      imageIdOrUid: CommonZodSchemas.Basic.UID,
    }),
  });

  // Require authentication middleware
  const authResult = await getLoggedInUser(req);
  const uid = authResult.getUid();

  if (!(await RateLimits.ROOM_CLIENT_RATING_READ(uid, req, res))) return;

  const roomData = await RoomRepo.findById(roomId, ApiResponseUrlType.GS_PATH);
  if (roomData == null) {
    throw CustomApiError.create(404, "Room not found");
  }
  if (roomData.ownerId === uid) {
    throw CustomApiError.create(403, "Owner never rates their own room");
  }

  if (uid !== uidFromQuery) {
    throw CustomApiError.create(401, "Unauthorized");
  }

  const rating = (await RoomRatingsService.get(uid, roomId)) ?? 0;
  return respond(res, { status: 200, json: { rating } });
});
