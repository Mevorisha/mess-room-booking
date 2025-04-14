import { NextApiRequest, NextApiResponse } from "next";
import Booking, { AcceptanceStatus, BookingQueryParams } from "@/models/Booking";
import { Timestamp } from "firebase-admin/firestore";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { getLoggedInUser } from "@/middlewares/auth";
import { CustomApiError } from "@/lib/utils/ApiError";
import { RateLimits } from "@/middlewares/rateLimit";
import { LRUCache } from "lru-cache";

// Configure LRU cache
// Store up to 100 queries for 5 minutes (300,000 ms)
const bookingsCache = new LRUCache<string, any[]>({
  max: 100,
  ttl: 1000 * 60 * 5,
  allowStale: false,
});

// Number of items per page
const PAGE_SIZE = 8;

/**
 * ```
 * request = "GET /api/bookings/readListOnQuery
 *   &self=true|false
 *   &tenantId=string
 *   &roomId=string
 *   &acceptance=ACCEPTED|REJECTED
 *   &isAccepted=true|false
 *   &isCancelled=true|false
 *   &isCleared=true|false
 *   &createdAfter=ISODateString
 *   &modifiedAfter=ISODateString
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
 *     acceptance?: "ACCEPTED" | "REJECTED"
 *     acceptedOn?: string (ISO date)
 *     cancelledOn?: string (ISO date)
 *     clearedOn?: string (ISO date)
 *     isAccepted: boolean
 *     isCancelled: boolean
 *     isCleared: boolean
 *     createdOn: string (ISO date)
 *     lastModifiedOn: string (ISO date)
 *     ttl?: string (ISO date, only included when self=true)
 *   }>
 * }
 * ```
 */
export default withmiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  // Allow only GET requests
  if (req.method !== "GET") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }
  // Check if we're requesting self bookings
  const isSelfQuery = req.query["self"] === "true";
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
    const queryParams = parseQueryParams(req, uid, isSelfQuery);
    // Execute the query
    const bookingsData = await Booking.queryAll(queryParams);
    // Format the response
    formattedBookings = formatBookings(bookingsData, isSelfQuery);
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
function parseQueryParams(req: NextApiRequest, uid: string, isSelfQuery: boolean): BookingQueryParams {
  const queryParams: BookingQueryParams = {};
  // For self queries, we just need the user ID as tenantId
  if (isSelfQuery) {
    queryParams.tenantId = uid;
  } else if (req.query["tenantId"]) {
    // For non-self queries, filter by tenantId if provided
    queryParams.tenantId = req.query["tenantId"] as string;
  }
  // Handle roomId filter
  if (req.query["roomId"]) {
    queryParams.roomId = req.query["roomId"] as string;
  }
  // Handle acceptance filter
  if (req.query["acceptance"] && ["ACCEPTED", "REJECTED"].includes(req.query["acceptance"] as string)) {
    queryParams.acceptance = req.query["acceptance"] as AcceptanceStatus;
  }
  // Handle boolean status filters
  if (req.query["isAccepted"]) {
    queryParams.isAccepted = req.query["isAccepted"] === "true";
  }
  if (req.query["isCancelled"]) {
    queryParams.isCancelled = req.query["isCancelled"] === "true";
  }
  if (req.query["isCleared"]) {
    queryParams.isCleared = req.query["isCleared"] === "true";
  }
  // Handle timestamps if needed
  if (req.query["createdAfter"]) {
    queryParams.createdOn = Timestamp.fromDate(new Date(req.query["createdAfter"] as string));
  }
  if (req.query["modifiedAfter"]) {
    queryParams.lastModifiedOn = Timestamp.fromDate(new Date(req.query["modifiedAfter"] as string));
  }
  return queryParams;
}

/**
 * Formats booking data for the response and adds self specific fields
 */
function formatBookings(bookingsData: Array<any>, isSelfQuery: boolean): any[] {
  return bookingsData.map((booking) => {
    // Common booking properties
    const formattedBooking: any = {
      id: booking.id,
      tenantId: booking.tenantId,
      roomId: booking.roomId,
      occupantCount: booking.occupantCount,
      acceptance: booking.acceptance,
      isAccepted: booking.isAccepted,
      isCancelled: booking.isCancelled,
      isCleared: booking.isCleared,
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
    if (isSelfQuery && booking.ttl) {
      formattedBooking.ttl = booking.ttl.toDate().toISOString();
      formattedBooking.isDeleted = true;
    } else {
      formattedBooking.isDeleted = false;
    }
    return formattedBooking;
  });
}
