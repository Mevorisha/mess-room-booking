import { NextApiResponse } from "next";

export function respond(
  res: NextApiResponse,
  result: { status: number; message?: string; error?: string; json?: Object }
): void {
  const response = result.json
    ? res.status(result.status).json(result.json)
    : res.status(result.status).json({
        status: result.status,
        message: result.message ?? result.error ?? "Unknown error occurred",
      });
}
