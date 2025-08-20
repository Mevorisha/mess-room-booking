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
import { ApiResponseUrlType, RoomPatchReqBodyDTO } from "sharedtypes";
import { RoomRatingsService } from "@/services/Room/RoomRatingsService";

/**
 * ```
 * request = "PATCH /api/rooms/[roomId]/[imageIdOrUid]/updateRating" {
 *   rating: 1..=5
 * }
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Extract query params from request
  const { roomId, imageIdOrUid: uidFromQuery } = RequestValidationParser.parse({
    req,
    method: "PATCH",
    params: z.object({
      roomId: CommonZodSchemas.Basic.UID,
      imageIdOrUid: CommonZodSchemas.Basic.UID,
    }),
  });

  // Require authentication middleware
  const authResult = await getLoggedInUser(req);
  const uid = authResult.getUid();

  if (!(await RateLimits.ROOM_CLIENT_RATING_UPDATE(uid, req, res))) return;

  const roomData = await RoomRepo.findById(roomId, ApiResponseUrlType.GS_PATH);
  if (roomData == null) {
    throw CustomApiError.create(404, "Room not found");
  }
  if (roomData.ownerId === uid) {
    throw CustomApiError.create(403, "Owner cannot rate their own room");
  }

  if (uid !== uidFromQuery) {
    throw CustomApiError.create(401, "Unauthorized");
  }

  const bodyResult = RoomPatchReqBodyDTO.Rating.fromJson(req.body);
  if (bodyResult.isErr) {
    throw CustomApiError.create(400, "Bad Request", bodyResult.error);
  }
  const { rating } = bodyResult.value;

  await RoomRatingsService.set(uid, roomId, rating);
  return respond(res, { status: 200, message: `Rating for room ${roomId} updated` });
});
