import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { RoomRepo } from "@/repo/RoomRepo";
import { ApiResponseUrlType } from "sharedtypes";

/**
 * ```
 * request = "GET /api/rooms/[roomId]/readRating"
 * response = { rating: 0..=5 }
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (!(await RateLimits.ROOM_RATING_READ(req, res))) return;

  const { roomId } = RequestValidationParser.parse({
    req,
    method: "GET",
    params: z.object({ roomId: CommonZodSchemas.Basic.UID }),
  });

  const roomDto = await RoomRepo.findById(roomId, ApiResponseUrlType.GS_PATH);
  if (roomDto == null) {
    throw CustomApiError.create(404, "Room not found");
  }
  return respond(res, { status: 200, json: { rating: roomDto.rating } });
});
