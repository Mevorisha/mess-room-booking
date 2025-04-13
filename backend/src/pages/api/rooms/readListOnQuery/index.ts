import { NextApiRequest, NextApiResponse } from "next";
import Room, { AcceptGender, AcceptOccupation, RoomQueryParams, RoomReadDataWithId } from "@/models/Room";
import { Timestamp } from "firebase-admin/firestore";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { getLoggedInUser } from "@/middlewares/auth";
import { CustomApiError } from "@/lib/utils/ApiError";
import { RateLimits } from "@/middlewares/rateLimit";
import { LRUCache } from "lru-cache";

// Configure LRU cache
// Store up to 100 queries for 5 minutes (300,000 ms)
const roomsCache = new LRUCache<string, any[]>({
  max: 100,
  ttl: 1000 * 60 * 5,
  allowStale: false,
});

// Number of items per page
const PAGE_SIZE = 12;

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
 *   &page=number
 *   &invalidateCache=boolean
 * "
 *
 * response = {
 *   totalItems: number,
 *   totalPages: number,
 *   currentPage: number,
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
  const isSelfQuery = req.query["self"] === "true";
  // Parse pagination parameters
  const page = parseInt(req.query["page"] as string, 10) || 1;
  // Cache invalidation
  const invalidateCache = req.query["invalidateCache"] === "true" ? true : false;
  // Parse sorting parameters
  const sortOn = req.query["sortOn"] as "capacity" | "rating" | "pricePerOccupant" | undefined;
  const sortOrder = req.query.sortOrder as "asc" | "desc" | undefined;
  // Handle authentication for self queries
  let uid: string | null = null;
  if (isSelfQuery) {
    const authResult = await getLoggedInUser(req);
    if (!authResult.isSuccess()) {
      throw CustomApiError.create(401, "Authentication required");
    }
    uid = authResult.getUid();
  }
  // Apply rate limiting
  if (!(await RateLimits.ROOM_SEARCH_READ(uid, req, res))) return;
  // Generate cache key by removing page parameter from the URL
  const cacheKey = generateCacheKey(req);
  // Try to get results from cache
  let formattedRooms = roomsCache.get(cacheKey);
  // If not in cache, fetch from database
  // Also, cache invalidation can be requested in query params
  if (!formattedRooms || invalidateCache) {
    // Parse query parameters
    const queryParams = parseQueryParams(req, isSelfQuery, uid);
    // Execute the query with sorting
    const roomsData = await Room.queryAll(queryParams, "API_URI", sortOn, sortOrder);
    // Format the response
    formattedRooms = formatRooms(roomsData, isSelfQuery);
    // Store in cache
    roomsCache.set(cacheKey, formattedRooms);
  }
  // Apply pagination
  const paginatedResponse = paginateResults(formattedRooms, page);
  return respond(res, { status: 200, json: paginatedResponse });
});

/**
 * Generates a cache key based on the request URL without the page parameter
 */
function generateCacheKey(req: NextApiRequest): string {
  // Clone query parameters
  const queryParams = { ...req.query };
  // Remove page and invalidateCache parameters
  delete queryParams.page;
  delete queryParams.invalidateCache;
  // Convert to a sorted string to ensure consistent keys
  const queryString = Object.entries(queryParams)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  // Construct the cache key
  return `${(req.url ?? "/?").split("?")[0]}?${queryString}`;
}

/**
 * Paginates the results based on the requested page
 */
function paginateResults(rooms: any[], page: number) {
  const totalRooms = rooms.length;
  const totalPages = Math.ceil(totalRooms / PAGE_SIZE);
  const validPage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (validPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalRooms);

  const paginatedRooms = rooms.slice(startIndex, endIndex);

  return {
    currentPage: validPage,
    totalPages,
    totalItems: totalRooms,
    rooms: paginatedRooms,
  };
}

/**
 * Parses and validates query parameters from the request
 */
function parseQueryParams(req: NextApiRequest, isSelfQuery: boolean, ownerId: string | null): RoomQueryParams {
  const queryParams: RoomQueryParams = {};
  // For self queries, we just need the owner ID
  if (isSelfQuery && ownerId) {
    queryParams.self = true;
    queryParams.ownerId = ownerId;
    return queryParams;
  }
  // Handle gender filter
  if (req.query.acceptGender && ["MALE", "FEMALE", "OTHER"].includes(req.query.acceptGender as string)) {
    queryParams.acceptGender = req.query.acceptGender as AcceptGender;
  }
  // Handle occupation filter
  if (req.query.acceptOccupation && ["STUDENT", "PROFESSIONAL", "ANY"].includes(req.query.acceptOccupation as string)) {
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
  return queryParams;
}

/**
 * Formats room data for the response and adds self specific fields
 */
function formatRooms(roomsData: RoomReadDataWithId[], isSelfQuery: boolean): any[] {
  return roomsData.map((room, index) => {
    // Common room properties
    const formattedRoom: any = {
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
      rating: room.rating,
    };

    // Add self-specific properties
    if (isSelfQuery) {
      formattedRoom.isUnavailable = room.isUnavailable;
      formattedRoom.isDeleted = !!room.ttl;
      if (room.ttl) {
        formattedRoom.ttl = room.ttl.toDate().toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
          day: "2-digit",
        });
      }
    }

    return formattedRoom;
  });
}
