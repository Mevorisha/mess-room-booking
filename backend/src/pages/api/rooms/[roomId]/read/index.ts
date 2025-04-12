import { NextApiRequest, NextApiResponse } from "next";
import Room, { SchemaFields } from "@/models/Room";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { getLoggedInUser } from "@/middlewares/auth";
import { CustomApiError } from "@/lib/utils/ApiError";
import { RateLimits } from "@/middlewares/rateLimit";

/**
 * ```
 * request = "GET /api/rooms/[roomId]/read"
 *
 * response = {
 *   id: string
 *   ownerId: string
 *   images: Array<{ small: string, medium: string, large: string }>
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
 *
 * < The following need authentication as room owner >
 *
 *   isUnavailable?: boolean
 * }
 * ```
 */
export default withmiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (!(await RateLimits.ROOM_READ(req, res))) return;

  // Allow only GET requests
  if (req.method !== "GET") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  // Extract roomId from the query
  const roomId = req.query["roomId"] as string;
  if (!roomId) {
    throw CustomApiError.create(400, "Missing field 'roomId: string'");
  }

  // Define fields to fetch
  const fields = [
    SchemaFields.IMAGES,
    SchemaFields.ACCEPT_GENDER,
    SchemaFields.ACCEPT_OCCUPATION,
    SchemaFields.SEARCH_TAGS,
    SchemaFields.LANDMARK,
    SchemaFields.ADDRESS,
    SchemaFields.CITY,
    SchemaFields.STATE,
    SchemaFields.MAJOR_TAGS,
    SchemaFields.MINOR_TAGS,
    SchemaFields.CAPACITY,
    SchemaFields.PRICE_PER_OCCUPANT,
    SchemaFields.OWNER_ID,
    SchemaFields.IS_UNAVAILABLE,
    SchemaFields.TTL,
  ];

  // Get room data
  const roomData = await Room.get(roomId, "API_URI", fields);
  if (!roomData) {
    throw CustomApiError.create(404, "Room not found");
  }

  // If user is authenticated, check if they are the room owner, and if not, delete sensitive room data
  // Additionally, if the room is marked isUnavailable, return 404
  const authResult = await getLoggedInUser(req);
  if (authResult.isSuccess()) {
    if (authResult.getUid() !== roomData.ownerId) {
      if (roomData.isUnavailable) {
        throw CustomApiError.create(404, "Room not found");
      }
      if (roomData.ttl) {
        throw CustomApiError.create(404, "Room not found");
      }
      delete roomData.isUnavailable;
      delete roomData.ttl;
    }
  }

  // Format response
  const response = {
    id: roomId,
    ...roomData,
    // Convert Sets back to arrays if they aren't already
    searchTags: Array.from(roomData.searchTags || []),
    majorTags: Array.from(roomData.majorTags || []),
    minorTags: Array.from(roomData.minorTags || []),
  };

  return respond(res, { status: 200, json: response });
});
