import { LRUCache } from "lru-cache";
import { NextApiRequest, NextApiResponse } from "next";

// Initialize LRU cache instead of Redis
const rateCache = new LRUCache({
  // Max number of items to store in cache
  max: 5000,
  // TTL for each entry in milliseconds (60 seconds/1 minute)
  ttl: 60 * 1000,
});

/**
 * Rate limiter function for Next.js API routes that incorporates URL path
 * @param frequency Maximum number of requests allowed in the time window (e.g., 10 requests per minute)
 * @param uid Optional user ID for tracking requests
 * @param path Optional path used in API url for tracking
 * @param req Next.js API request object
 * @param res Next.js API response object
 * @returns Promise<boolean> - true if request is allowed, false if rate limited
 */
export async function rateLimiter(
  frequency: number,
  uid: string | null,
  path: string | null,
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  // Use uid if provided, otherwise use IP address as identifier
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  // Extract the URL path to include in the rate limiting key
  const pathId = path || req.url || req.query.path || "/";
  // Create a unique identifier for rate limiting that includes both user/IP and path
  const identifier = uid || String(clientIp);
  // Create a key with a prefix and path
  const key = `ratelimit:${identifier}:${pathId}`;
  // Get current count for this identifier and path combination
  const currentCount = Number(rateCache.get(key)) || 0;
  // If count exists and exceeds frequency, reject the request
  if (currentCount && currentCount >= frequency) {
    res.status(429).json({
      error: "Too many requests, please try again later.",
    });
    console.log(`[W] [RateLimiter] blocked ${frequency} ${identifier} ${path}`);
    return false;
  }
  // Increment the counter (or create if doesn't exist)
  rateCache.set(key, (currentCount as number) + 1);
  // Request is allowed
  return true;
}

export const RateLimits = {
  // Profile operations
  PROFILE_CREATE: (uid: string, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(5, uid, "PROFILE_CREATE", req, res),
  PROFILE_READ: (req: NextApiRequest, res: NextApiResponse) => rateLimiter(60, null, "PROFILE_READ", req, res),
  PROFILE_PHOTO_READ: (req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(20, null, "PROFILE_PHOTO_READ", req, res),
  PROFILE_LANG_UPDATE: (uid: string, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(20, uid, "PROFILE_LANG_UPDATE", req, res),
  PROFILE_PHOTO_UPDATE: (uid: string, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(5, uid, "PROFILE_PHOTO_UPDATE", req, res),
  PROFILE_MOBILE_UPDATE: (uid: string, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(20, uid, "PROFILE_MOBILE_UPDATE", req, res),
  PROFILE_NAME_UPDATE: (uid: string, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(20, uid, "PROFILE_NAME_UPDATE", req, res),
  PROFILE_TYPE_UPDATE: (uid: string, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(20, uid, "PROFILE_TYPE_UPDATE", req, res),

  // ID document operations
  ID_DOC_READ: (req: NextApiRequest, res: NextApiResponse) => rateLimiter(20, null, "ID_DOC_READ", req, res),
  ID_DOC_UPDATE: (uid: string, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(5, uid, "ID_DOC_UPDATE", req, res),
  ID_DOC_VIS_UPDATE: (uid: string, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(20, uid, "ID_DOC_VIS_UPDATE", req, res),

  // Room operations
  ROOM_CREATE: (uid: string, req: NextApiRequest, res: NextApiResponse) => rateLimiter(5, uid, "ROOM_CREATE", req, res),
  ROOM_DELETE: (uid: string, req: NextApiRequest, res: NextApiResponse) => rateLimiter(5, uid, "ROOM_DELETE", req, res),
  ROOM_READ: (req: NextApiRequest, res: NextApiResponse) => rateLimiter(60, null, "ROOM_READ", req, res),
  ROOM_SEARCH_READ: (uid: string | null, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(60, uid, "ROOM_SEARCH_READ", req, res),
  ROOM_IMAGE_READ: (req: NextApiRequest, res: NextApiResponse) => rateLimiter(20, null, "ROOM_IMAGE_READ", req, res),
  ROOM_RATING_READ: (req: NextApiRequest, res: NextApiResponse) => rateLimiter(60, null, "ROOM_RATING_READ", req, res),
  ROOM_PARAMS_UPDATE: (uid: string, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(5, uid, "ROOM_PARAMS_UPDATE", req, res),
  ROOM_CLIENT_RATING_READ: (uid: string, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(60, uid, "ROOM_CLIENT_RATING_READ", req, res),
  ROOM_CLIENT_RATING_UPDATE: (uid: string, req: NextApiRequest, res: NextApiResponse) =>
    rateLimiter(20, uid, "ROOM_CLIENT_RATING_UPDATE", req, res),

  // Logging
  LOG_WRITE: (req: NextApiRequest, res: NextApiResponse) => rateLimiter(60, null, "LOG_WRITE", req, res),
};
