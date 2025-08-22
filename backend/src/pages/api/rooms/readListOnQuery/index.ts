import { NextApiRequest, NextApiResponse } from "next";
import {
  ApiResponseUrlType,
  HttpMethodTypes,
  PaginationDTO,
  RoomGetReqQueryParamsWrapper,
  RoomGetResBodyNotOwnerDTO,
  RoomGetResBodyOwnerDTO,
} from "sharedtypes";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { getLoggedInUser } from "@/middlewares/Auth";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { LRUCache } from "lru-cache";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { RoomSearchService } from "@/services/Room/RoomSearchService";
import { ADataTransferObj } from "sharedtypes/dist/types/abstract/ADataTransferObj";

type OneRoomEntry = RoomGetResBodyNotOwnerDTO | RoomGetResBodyOwnerDTO;

// Number of items per page
const PAGE_SIZE = 8;

// Configure LRU cache
const RoomsCache = new LRUCache<string, OneRoomEntry[]>({
  maxSize: 50 * 1024 * 1024, // Maximum size of the cache in bytes (50 MB)
  sizeCalculation: (value) => JSON.stringify(value).length, // Calculate size based on JSON string length
  ttl: 1000 * 60 * 2, // Time to live for cache items (2 minutes)
  allowStale: false,
});

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
 *   items: Array<{
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
 *     rating: number
 *
 * < The following need authentication >
 *
 *     isUnavailable: boolean
 *     createdOn: string (ISO date)
 *     lastModifiedOn: string (ISO date)
 *     ttl?: string (ISO date)
 *     isDeleted: boolean
 *   }>
 * }
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  RequestValidationParser.parse({ req, method: HttpMethodTypes.GET });

  const queryResult = RoomGetReqQueryParamsWrapper.fromURL(req.url, `https://${req.headers.host}`);
  if (queryResult.isErr) {
    throw CustomApiError.create(400, "Bad Request", queryResult.error);
  }
  const { self, sortOn, sortOrder, page, invalidateCache } = queryResult.value;

  // Handle authentication for self queries
  let uid: string | null = null;

  const authResult = await getLoggedInUser(req);
  if (!authResult.isSuccess()) {
    if (self) {
      throw CustomApiError.create(401, "Authentication required");
    } else {
      uid = null;
    }
  } else {
    uid = authResult.getUid();
    // For self queries, ensure the authenticated user matches the ownerId filter
    if (self && queryResult.value.get("ownerId") != null && queryResult.value.get("ownerId") !== uid) {
      throw CustomApiError.create(403, "Cannot query other user's rooms");
    }
    // If self=true but no ownerId provided, set it to the authenticated user's ID
    if (self && queryResult.value.get("ownerId") == null) {
      queryResult.value.set("ownerId", uid);
    }
  }

  // Apply rate limiting
  if (!(await RateLimits.ROOM_SEARCH_READ(uid, req, res))) return;

  // Generate cache key by removing page parameter from the URL
  const cacheKey = generateCacheKey(req);

  // Try to get results from cache
  let roomsData = RoomsCache.get(cacheKey);

  // If not in cache, fetch from database
  // Also, cache invalidation can be requested in query params
  if (roomsData == null || invalidateCache) {
    if (self) {
      // Execute the query - always fetch all fields, we'll filter in formatting
      roomsData = await RoomSearchService.queryAll(queryResult.value, ApiResponseUrlType.API_URI, {
        isOwner: true,
        sortOn,
        sortOrder,
      });
    } else {
      // Execute the query - always fetch all fields, we'll filter in formatting
      roomsData = await RoomSearchService.queryAll(queryResult.value, ApiResponseUrlType.API_URI, {
        isOwner: false,
        sortOn,
        sortOrder,
      });
    }

    // Store in cache
    RoomsCache.set(cacheKey, roomsData);
  }

  // Apply pagination
  let paginatedResponse: PaginationDTO<OneRoomEntry> | null = null;
  if (self) {
    paginatedResponse = paginateResults(roomsData, page, RoomGetResBodyOwnerDTO);
  } else {
    paginatedResponse = paginateResults(roomsData, page, RoomGetResBodyNotOwnerDTO);
  }

  return respond(res, { status: 200, json: paginatedResponse.toJSON() });
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
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  // Construct the cache key
  return `${(req.url ?? "/?").split("?")[0]}?${queryString}`;
}

/**
 * Paginates the results based on the requested page
 */
function paginateResults(
  rooms: OneRoomEntry[],
  page: number,
  roomsClass: typeof ADataTransferObj
): PaginationDTO<OneRoomEntry> {
  const totalItems = rooms.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const items = rooms.slice(startIndex, endIndex);

  return PaginationDTO.createGeneric<OneRoomEntry>({ currentPage, totalPages, totalItems, items }, roomsClass);
}
