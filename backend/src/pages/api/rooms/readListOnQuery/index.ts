import { NextApiRequest, NextApiResponse } from "next";
import Room, { RoomQueryParams, RoomDTO, PseudoFields, SchemaFields } from "@/models/Room";
import { AcceptGender, AcceptOccupation } from "@/models/types";
import { Timestamp } from "firebase-admin/firestore";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { getLoggedInUser } from "@/middlewares/Auth";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { LRUCache } from "lru-cache";

// Configure LRU cache
const roomsCache = new LRUCache<string, any[]>({
  maxSize: 50 * 1024 * 1024, // Maximum size of the cache in bytes (50 MB)
  sizeCalculation: (value) => JSON.stringify(value).length, // Calculate size based on JSON string length
  ttl: 1000 * 60 * 2, // Time to live for cache items (2 minutes)
  allowStale: false,
});

// Number of items per page
const PAGE_SIZE = 8;

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
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
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
  const sortOrder = req.query["sortOrder"] as "asc" | "desc" | undefined;

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

    const fields = [
      PseudoFields.ID,
      SchemaFields.OWNER_ID,
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
      SchemaFields.RATING,
      SchemaFields.IMAGES,
      SchemaFields.CREATED_ON,
      SchemaFields.LAST_MODIFIED_ON,
      SchemaFields.IS_UNAVAILABLE,
      SchemaFields.TTL,
      PseudoFields.IS_DELETED,
    ];

    // Execute the query - always fetch all fields, we'll filter in formatting
    const roomsData = await Room.queryAll(queryParams, "API_URI", sortOn, sortOrder, fields);

    // Format the response
    formattedRooms = formatRooms(roomsData, uid);

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
  delete queryParams["page"];
  delete queryParams["invalidateCache"];
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
 * Parses query parameters from the request
 */
function parseQueryParams(req: NextApiRequest, isSelfQuery: boolean, ownerId: string | null): RoomQueryParams {
  const queryParams: RoomQueryParams = {};

  if (isSelfQuery && ownerId) {
    // For self queries, just filter by ownerId
    queryParams.ownerId = ownerId;
  } else {
    // For non-self queries, parse all query parameters

    // Handle gender filter
    if (req.query["acceptGender"] && ["MALE", "FEMALE", "OTHER"].includes(req.query["acceptGender"] as string)) {
      queryParams.acceptGender = req.query["acceptGender"] as AcceptGender;
    }

    // Handle occupation filter
    if (
      req.query["acceptOccupation"] &&
      ["STUDENT", "PROFESSIONAL", "ANY"].includes(req.query["acceptOccupation"] as string)
    ) {
      queryParams.acceptOccupation = req.query["acceptOccupation"] as AcceptOccupation;
    }

    // Handle string filters
    if (req.query["landmark"]) queryParams.landmark = req.query["landmark"] as string;
    if (req.query["city"]) queryParams.city = req.query["city"] as string;
    if (req.query["state"]) queryParams.state = req.query["state"] as string;

    // Handle numeric filters
    if (req.query["capacity"]) queryParams.capacity = parseInt(req.query["capacity"] as string, 10);
    if (req.query["lowPrice"]) queryParams.lowPrice = parseFloat(req.query["lowPrice"] as string);
    if (req.query["highPrice"]) queryParams.highPrice = parseFloat(req.query["highPrice"] as string);

    // Handle search tags
    if (req.query["searchTags"]) {
      const tagsArray = (req.query["searchTags"] as string).split(",");
      queryParams.searchTags = new Set(tagsArray);
    }

    // Handle timestamps if needed
    if (req.query["createdAfter"]) {
      queryParams.createdOn = Timestamp.fromDate(new Date(req.query["createdAfter"] as string));
    }
    if (req.query["modifiedAfter"]) {
      queryParams.lastModifiedOn = Timestamp.fromDate(new Date(req.query["modifiedAfter"] as string));
    }
  }

  return queryParams;
}

/**
 * Formats room data for the response and adds owner-specific fields if user is the owner
 */
function formatRooms(roomsData: Partial<RoomDTO>[], authenticatedUserId: string | null): any[] {
  return roomsData.map((room, _) => {
    // Check if the authenticated user is the owner of this room
    const isOwner = authenticatedUserId && room.ownerId === authenticatedUserId;

    // Common room properties
    const formattedRoom: Partial<RoomDTO> = {};
    if (room.id) formattedRoom.id = room.id;
    if (room.ownerId) formattedRoom.ownerId = room.ownerId;
    if (room.images) formattedRoom.images = room.images;
    if (room.acceptGender) formattedRoom.acceptGender = room.acceptGender;
    if (room.acceptOccupation) formattedRoom.acceptOccupation = room.acceptOccupation;
    if (room.searchTags) formattedRoom.searchTags = Array.from(room.searchTags);
    if (room.landmark) formattedRoom.landmark = room.landmark;
    if (room.address) formattedRoom.address = room.address;
    if (room.city) formattedRoom.city = room.city;
    if (room.state) formattedRoom.state = room.state;
    if (room.majorTags) formattedRoom.majorTags = Array.from(room.majorTags || []);
    if (room.minorTags) formattedRoom.minorTags = Array.from(room.minorTags || []);
    if (room.capacity) formattedRoom.capacity = room.capacity;
    if (room.pricePerOccupant) formattedRoom.pricePerOccupant = room.pricePerOccupant;
    if (room.rating) formattedRoom.rating = room.rating;

    // Add timestamps if available
    if (room.createdOn) {
      formattedRoom.createdOn = room.createdOn;
    }
    if (room.lastModifiedOn) {
      formattedRoom.lastModifiedOn = room.lastModifiedOn;
    }

    // Add owner-specific properties only if user is the owner
    if (isOwner) {
      if (room.isUnavailable != null) {
        formattedRoom.isUnavailable = room.isUnavailable;
      }
      if (room.isDeleted != null) {
        formattedRoom.isDeleted = room.isDeleted;
      }
      if (room.ttl != null) {
        formattedRoom.ttl = room.ttl;
      }
    }

    return formattedRoom;
  });
}
