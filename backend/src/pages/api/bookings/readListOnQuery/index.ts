import { NextApiRequest, NextApiResponse } from "next";
import Booking, { BookingQueryIdType, BookingQueryParams } from "@/models/Booking";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { getLoggedInUser } from "@/middlewares/Auth";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { LRUCache } from "lru-cache";
import Room, { SchemaFields } from "@/models/Room";

// Configure LRU cache
const bookingsCache = new LRUCache<string, any[]>({
  maxSize: 50 * 1024 * 1024, // Maximum size of the cache in bytes (50 MB)
  sizeCalculation: (value) => JSON.stringify(value).length, // Calculate size based on JSON string length
  ttl: 1000 * 60 * 2, // Time to live for cache items (2 minutes)
  allowStale: false,
});

// Number of items per page
const PAGE_SIZE = 8;

/**
 * ```
 * request = "GET /api/bookings/readListOnQuery
 *   &queryIdType=TENANT | ROOM | OWNER
 *   &id=string (tenantId, roomId, or ownerId based on queryIdType)
 *   &page=number
 *   &invalidateCache=boolean
 * "
 *
 * response = {
 *   totalItems: number,
 *   totalPages: number,
 *   currentPage: number,
 *   bookings: Array<{
 *     id: string
 *     tenantId: string
 *     roomId: string
 *     occupantCount: number
 *     isSubmitted: boolean
 *     acceptanceStatus?: "UNSET" | "ACCEPTED" | "REJECTED"
 *     isCancelled: boolean
 *     isCleared: boolean
 *     submittedOn?: string (ISO date)
 *     acceptedOn?: string (ISO date)
 *     cancelledOn?: string (ISO date)
 *     clearedOn?: string (ISO date)
 *     createdOn: string (ISO date)
 *     lastModifiedOn: string (ISO date)
 *     ttl?: string (ISO date, only included when uid is owner or roomId)
 *     isDeleted?: boolean (true if ttl is set, false otherwise, hidden from tenants)
 *   }>
 * }
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Allow only GET requests
  if (req.method !== "GET") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }
  // Parse pagination parameters
  const page = parseInt(req.query["page"] as string, 10) || 1;
  // Cache invalidation
  const invalidateCache = req.query["invalidateCache"] === "true" ? true : false;
  // Handle authentication for all queries (bookings are user-specific)
  const authResult = await getLoggedInUser(req);
  if (!authResult.isSuccess()) {
    throw CustomApiError.create(401, "Authentication required");
  }
  const uid = authResult.getUid();
  // Apply rate limiting
  if (!(await RateLimits.BOOKING_SEARCH_READ(uid, req, res))) return;
  // Generate cache key by removing page parameter from the URL
  const cacheKey = generateCacheKey(req);
  // Try to get results from cache
  let formattedBookings = bookingsCache.get(cacheKey);
  // If not in cache, fetch from database
  // Also, cache invalidation can be requested in query params
  if (!formattedBookings || invalidateCache) {
    // Parse query parameters
    const queryParams = parseQueryParams(req);
    let uidIsRoomOwner = false;
    // ensure the owner or tenant whoever is viewing the bookings is logged in as themselves
    if (queryParams.queryIdType === "OWNER") {
      if (queryParams.id !== uid) {
        throw CustomApiError.create(403, "Owner ID does not match logged-in user");
      } else {
        uidIsRoomOwner = true;
      }
    } else if (queryParams.queryIdType === "ROOM") {
      // user should be looged in as room owner to view bookings of a room
      const roomId = queryParams.id;
      if (!roomId) {
        throw CustomApiError.create(400, "Room ID is required for ROOM queryIdType");
      }
      const room = await Room.get(roomId, "API_URI", [SchemaFields.OWNER_ID]);
      if (!room) {
        throw CustomApiError.create(404, "Room not found");
      }
      if (room.ownerId !== uid) {
        throw CustomApiError.create(403, "You are not the owner of this room");
      }
      uidIsRoomOwner = true;
    } else if (queryParams.queryIdType === "TENANT") {
      if (queryParams.id !== uid) {
        throw CustomApiError.create(403, "Tenant ID does not match logged-in user");
      }
      uidIsRoomOwner = false; // Tenant is not a room owner
    } else {
      throw CustomApiError.create(400, "Invalid queryIdType. Must be TENANT, ROOM, or OWNER");
    }
    // Execute the query
    const bookingsData = await Booking.queryAll(queryParams);
    // Format the response
    formattedBookings = formatBookings(bookingsData, uidIsRoomOwner);
    // Store in cache
    bookingsCache.set(cacheKey, formattedBookings);
  }
  // Apply pagination
  const paginatedResponse = paginateResults(formattedBookings, page);
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
function paginateResults(bookings: any[], page: number) {
  const totalBookings = bookings.length;
  const totalPages = Math.ceil(totalBookings / PAGE_SIZE);
  const validPage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (validPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalBookings);

  const paginatedBookings = bookings.slice(startIndex, endIndex);

  return {
    currentPage: validPage,
    totalPages,
    totalItems: totalBookings,
    bookings: paginatedBookings,
  };
}

/**
 * Parses and validates query parameters from the request
 */
function parseQueryParams(req: NextApiRequest): BookingQueryParams {
  const queryIdType = (req.query["queryIdType"] as string).toUpperCase() as BookingQueryIdType | null;
  const id = req.query["id"] as string;
  if (!queryIdType || !id) return {};
  return { queryIdType, id };
}

/**
 * Formats booking data for the response and adds self specific fields
 */
function formatBookings(bookingsData: Array<any>, uidIsRoomOwner: boolean): any[] {
  return bookingsData.map((booking) => {
    // Common booking properties
    const formattedBooking: any = {
      tenantId: booking.tenantId,
      roomId: booking.roomId,
    };
    // Format timestamps to ISO strings when they exist
    if (booking.acceptedOn) {
      formattedBooking.acceptedOn = booking.acceptedOn.toDate().toISOString();
    }
    if (booking.cancelledOn) {
      formattedBooking.cancelledOn = booking.cancelledOn.toDate().toISOString();
    }
    if (booking.clearedOn) {
      formattedBooking.clearedOn = booking.clearedOn.toDate().toISOString();
    }
    if (booking.createdOn) {
      formattedBooking.createdOn = booking.createdOn.toDate().toISOString();
    }
    if (booking.lastModifiedOn) {
      formattedBooking.lastModifiedOn = booking.lastModifiedOn.toDate().toISOString();
    }
    // Add ttl info for self-queries
    if (uidIsRoomOwner && booking.ttl) {
      formattedBooking.ttl = booking.ttl.toDate().toISOString();
      formattedBooking.isDeleted = true;
    } else {
      formattedBooking.isDeleted = false;
    }
    return formattedBooking;
  });
}
