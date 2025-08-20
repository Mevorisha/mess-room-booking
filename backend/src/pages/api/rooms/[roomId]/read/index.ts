import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { getLoggedInUser } from "@/middlewares/Auth";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { RoomRepo } from "@/repo/RoomRepo";
import { ApiResponseUrlType } from "sharedtypes";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";

/**
 * ```
 * request = "GET /api/rooms/[roomId]/read"
 *
 * response = {
 *   id: string
 *   ownerId: string
 *   acceptGender: "MALE" | "FEMALE" | "OTHER"
 *   acceptOccupation: "STUDENT" | "PROFESSIONAL" | "ANY"
 *   searchTags: string[]
 *   landmark: string
 *   address: string
 *   city: string
 *   state: string
 *   majorTags: string[]
 *   minorTags: string[]
 *   capacity: number
 *   pricePerOccupant: number
 *   images: Array<{ small: string, medium: string, large: string }>
 *   rating: number
 *   createdOn: string (ISO date)
 *   lastModifiedOn: string (ISO date)
 *
 * < shown only to room owner >
 *
 *   isUnavailable?: boolean
 *   ttl?: string (ISO date)
 *   isDeleted?: boolean (true if ttl is set, false otherwise)
 * }
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (!(await RateLimits.ROOM_READ(req, res))) return;

  const { roomId } = RequestValidationParser.parse({
    req,
    method: "GET",
    params: z.object({ roomId: CommonZodSchemas.Basic.UID }),
  });

  let uid: string | null = null;

  const authResult = await getLoggedInUser(req);
  if (authResult.isSuccess()) {
    uid = authResult.getUid();
  }

  // Get room data
  const roomDto = await RoomRepo.findById(roomId, ApiResponseUrlType.API_URI, { isOwner: true });
  if (roomDto == null) {
    throw CustomApiError.create(404, "Room not found");
  }

  // Check if room should be hidden from non-owners
  const isOwner = uid === roomDto.ownerId;
  const isAccessible = !roomDto.isUnavailable && !roomDto.isDeleted
  // If not owner then 404 if room unavailable
  // i.e. -> if accessible, room is visible to everyone
  //      -> if unavailable or deleted, room is visible to owner only
  if (!isOwner && !isAccessible) {
    throw CustomApiError.create(404, "Room not found");
  }

  // Return appropriate DTO based on ownership
  const responseDto = isOwner ? roomDto : roomDto.toNotOwnerDTO();
  return respond(res, { status: 200, dto: responseDto });
});
