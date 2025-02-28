import { VercelResponse } from "@vercel/node";

export function respond(
  res: VercelResponse,
  result: { status: number; message?: string; error?: string; json?: Object }
): VercelResponse {
  return result.json
    ? res.status(result.status).json(result.json)
    : res.status(result.status).json({
        status: result.status,
        message: result.message ?? result.error ?? "Unknown error occurred",
      });
}
