import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { CustomApiError } from "@/lib/utils/ApiError";

/**
 * Processes an error and sends an appropriate HTTP response.
 *
 * If the error is an instance of CustomApiError, the function responds with the error's status and message and logs the details.
 * Otherwise, it sends a generic 500 Internal Server Error response and logs the error stack trace.
 *
 * @param e - The error encountered during API processing.
 * @param res - The Next.js API response object.
 */
function handleErr(e: any, res: NextApiResponse) {
  if (e instanceof CustomApiError) {
    respond(res, { status: e.status, error: e.message });
    console.error(e.status, e.message);
  } else {
    respond(res, { status: 500, error: "Internal Server Error" });
    console.trace(e);
  }
}

/**
 * Wraps an API handler function to centralize error handling.
 *
 * Executes the provided API handler function within a try/catch block. If the handler returns a promise,
 * any rejection is caught and passed to the centralized error handler. Synchronous errors are also caught
 * and handled consistently.
 *
 * @param req - API request object.
 * @param res - API response object.
 * @param handlerFn - The asynchronous API handler function to execute.
 */
export function catchAll(
  req: NextApiRequest,
  res: NextApiResponse,
  handlerFn: (req: NextApiRequest, res: NextApiResponse) => Promise<NextApiResponse | undefined | void>
) {
  try {
    const prom = handlerFn(req, res);
    if (prom instanceof Promise) prom.catch((e) => handleErr(e, res));
  } catch (e) {
    handleErr(e, res);
  }
}
