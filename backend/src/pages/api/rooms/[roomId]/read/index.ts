import { NextApiRequest, NextApiResponse } from "next";
import Room, { SchemaFields } from "@/models/Room";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { getLoggedInUser } from "@/middlewares/auth";
import { CustomApiError } from "@/lib/utils/ApiError";

/**
 * ```
 * request = "GET /api/rooms/[roomId]/read"
 *
 * response = {
 *   id: string
 *   images: Array<string>
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
  ];

  // Check if user is logged in and is the room owner
  const authResult = await getLoggedInUser(req);
  let isOwner = false;

  // Get room data
  const roomData = await Room.get(roomId, "API_URI", fields);
  if (!roomData) {
    throw CustomApiError.create(404, "Room not found");
  }

  // If user is authenticated, check if they are the room owner
  if (authResult.isSuccess()) {
    const loggedInUid = authResult.getUid();
    if (loggedInUid === roomData.ownerId) {
      isOwner = true;
      // Fetch additional owner-only field
      const ownerRoomData = await Room.get(roomId, "API_URI", [...fields, SchemaFields.IS_UNAVAILABLE]);

      // Format response
      const response = {
        id: roomId,
        ...ownerRoomData,
        // Convert Sets back to arrays if they aren't already
        searchTags: Array.from(ownerRoomData.searchTags || []),
        majorTags: Array.from(ownerRoomData.majorTags || []),
        minorTags: Array.from(ownerRoomData.minorTags || []),
      };

      // Remove ownerId from the response
      delete response.ownerId;

      return respond(res, { status: 200, json: response });
    }
  }

  // Format response for non-owners
  const response = {
    id: roomId,
    ...roomData,
    // Convert Sets back to arrays if they aren't already
    searchTags: Array.from(roomData.searchTags || []),
    majorTags: Array.from(roomData.majorTags || []),
    minorTags: Array.from(roomData.minorTags || []),
  };

  // Remove ownerId from the response
  delete response.ownerId;

  return respond(res, { status: 200, json: response });
});
