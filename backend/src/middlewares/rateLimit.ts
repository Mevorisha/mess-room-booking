import { NextApiRequest, NextApiResponse } from "next";
import Redis from "ioredis";

// Initialize Redis client (adjust connection options as needed)
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

/**
 * Rate limiter function for Next.js API routes that incorporates URL path
 * @param frequency Maximum number of requests allowed in the time window (e.g., 10 requests per minute)
 * @param uid Optional user ID for tracking requests
 * @param req Next.js API request object
 * @param res Next.js API response object
 * @returns Promise<boolean> - true if request is allowed, false if rate limited
 */
export async function rateLimiter(
  frequency: number,
  uid: string | null,
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  // Use uid if provided, otherwise use IP address as identifier
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  // Extract the URL path to include in the rate limiting key
  const path = req.url || req.query.path || "/";
  // Create a unique identifier for rate limiting that includes both user/IP and path
  const identifier = uid || String(clientIp);
  // Create a key for Redis with a prefix and path
  const key = `ratelimit:${identifier}:${path}`;
  // Get current count for this identifier and path combination
  const currentCount = await redis.get(key);
  // If count exists and exceeds frequency, reject the request
  if (currentCount && parseInt(currentCount) >= frequency) {
    res.status(429).json({
      error: "Too many requests, please try again later.",
    });
    return false;
  }
  // Increment the counter (or create if doesn't exist)
  await redis.incr(key);
  // Set expiry of 1 minute if this is a new key
  if (!currentCount) {
    await redis.expire(key, 60); // 60 seconds window
  }
  // Request is allowed
  return true;
}
