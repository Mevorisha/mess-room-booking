import { NextApiRequest, NextApiResponse } from "next";
import Room, { AcceptGender, AcceptOccupation } from "@/models/Room";
import { Timestamp } from "firebase-admin/firestore";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { getLoggedInUser } from "@/middlewares/auth";
import { CustomApiError } from "@/lib/utils/ApiError";
import { RateLimits } from "@/middlewares/rateLimit";

/**
 * ```
 * request = "GET /api/rooms/readListOnQuery
 *   ?self=true|false
 *   &acceptGender=MALE|FEMALE|OTHER
 *   &acceptOccupation=STUDENT|PROFESSIONAL|ANY
 *   &landmark=string
 *   &city=string
 *   &state=string
 *   &capacity=number
 *   &lowPrice=number
 *   &highPrice=number
 *   &searchTags=tag1,tag2,tag3
 *   &sortOn=capacity|rating|pricePerOccupant
 *   &sortOrder=asc|desc
 * "
 *
 * response = {
 *   rooms: Array<{
 *     id: string
 *     ownerId: string
 *     images: Array<string>
 *     acceptGender: "MALE" | "FEMALE" | "OTHER"
 *     acceptOccupation: "STUDENT" | "PROFESSIONAL" | "ANY"
 *     searchTags: string[]
 *     landmark: string
 *     address: string
 *     city: string
 *     state: string
 *     majorTags: string[]
 *     minorTags: string[]
 *     capacity: number
 *     pricePerOccupant: number
 *     isUnavailable?: boolean (only included when self=true)
 *     isDeleted?: boolean (only included when self=true)
 *     ttl?: string (only included when self=true)
 *   }>
 * }
 * ```
 */
export default withmiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Allow only GET requests
  if (req.method !== "GET") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  // Check if we're requesting self rooms
  const selfParam = req.query["self"];
  const isSelfQuery = selfParam === "true";

  // Parse sorting parameters
  const sortOn = req.query["sortOn"] as "capacity" | "rating" | "pricePerOccupant" | undefined;
  const sortOrder = req.query.sortOrder as "asc" | "desc" | undefined;

  if (isSelfQuery) {
    // Auth is required for self queries
    const authResult = await getLoggedInUser(req);
    if (!authResult.isSuccess()) {
      throw CustomApiError.create(401, "Authentication required");
    }

    const uid = authResult.getUid();

    if (!(await RateLimits.ROOM_SEARCH_READ(uid, req, res))) return;

    // Query all rooms owned by this user with sorting
    const roomsData = await Room.queryAll({ self: isSelfQuery, ownerId: uid }, "API_URI", sortOn, sortOrder);

    // Format the response
    const formattedRooms = roomsData.map((room, index) => ({
      id: room.id,
      ownerId: room.ownerId || `unknown-${index}`,
      images: room.images || [],
      acceptGender: room.acceptGender,
      acceptOccupation: room.acceptOccupation,
      searchTags: Array.from(room.searchTags || []),
      landmark: room.landmark,
      address: room.address,
      city: room.city,
      state: room.state,
      majorTags: Array.from(room.majorTags || []),
      minorTags: Array.from(room.minorTags || []),
      capacity: room.capacity,
      pricePerOccupant: room.pricePerOccupant,
      isUnavailable: room.isUnavailable,
      isDeleted: !!room.ttl,
      ttl: room.ttl?.toDate().toLocaleDateString("en-US", { month: "short", year: "numeric", day: "2-digit" }),
    }));

    return respond(res, { status: 200, json: { rooms: formattedRooms } });
  } else {
    if (!(await RateLimits.ROOM_SEARCH_READ(null, req, res))) return;

    // Parse query parameters
    const queryParams: any = {};

    // Handle gender filter
    if (req.query.acceptGender && ["MALE", "FEMALE", "OTHER"].includes(req.query.acceptGender as string)) {
      queryParams.acceptGender = req.query.acceptGender as AcceptGender;
    }

    // Handle occupation filter
    if (
      req.query.acceptOccupation &&
      ["STUDENT", "PROFESSIONAL", "ANY"].includes(req.query.acceptOccupation as string)
    ) {
      queryParams.acceptOccupation = req.query.acceptOccupation as AcceptOccupation;
    }

    // Handle string filters
    if (req.query.landmark) queryParams.landmark = req.query.landmark as string;
    if (req.query.city) queryParams.city = req.query.city as string;
    if (req.query.state) queryParams.state = req.query.state as string;

    // Handle numeric filters
    if (req.query.capacity) queryParams.capacity = parseInt(req.query.capacity as string, 10);
    if (req.query.lowPrice) queryParams.lowPrice = parseFloat(req.query.lowPrice as string);
    if (req.query.highPrice) queryParams.highPrice = parseFloat(req.query.highPrice as string);

    // Handle search tags
    if (req.query.searchTags) {
      const tagsArray = (req.query.searchTags as string).split(",");
      queryParams.searchTags = new Set(tagsArray);
    }

    // Handle timestamps if needed
    if (req.query.createdAfter) {
      queryParams.createdOn = Timestamp.fromDate(new Date(req.query.createdAfter as string));
    }
    if (req.query.modifiedAfter) {
      queryParams.lastModifiedOn = Timestamp.fromDate(new Date(req.query.modifiedAfter as string));
    }

    // Execute the query with sorting
    const roomsData = await Room.queryAll(queryParams, "API_URI", sortOn, sortOrder);

    // Format the response
    const formattedRooms = roomsData.map((room, index) => {
      return {
        id: room.id,
        ownerId: room.ownerId || `unknown-${index}`,
        images: room.images || [],
        acceptGender: room.acceptGender,
        acceptOccupation: room.acceptOccupation,
        searchTags: Array.from(room.searchTags || []),
        landmark: room.landmark,
        address: room.address,
        city: room.city,
        state: room.state,
        majorTags: Array.from(room.majorTags || []),
        minorTags: Array.from(room.minorTags || []),
        capacity: room.capacity,
        pricePerOccupant: room.pricePerOccupant,
      };
    });

    return respond(res, { status: 200, json: { rooms: formattedRooms } });
  }
});
