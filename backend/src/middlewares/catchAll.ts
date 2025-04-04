import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { CustomApiError } from "@/lib/utils/ApiError";

/**
 * Handles errors by sending an appropriate API response.
 *
 * This function checks if the provided error is an instance of CustomApiError.
 * If so, it responds with the error's status and message; otherwise, it responds with a
 * generic 500 Internal Server Error message. It also logs the error details to the console.
 *
 * @param e - The error to handle, which may be a CustomApiError or other type.
 * @param res - The Next.js response object for sending the API response.
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
 * Executes an API handler function and centralizes error handling.
 *
 * This function invokes the provided asynchronous handler to process an API request. Both synchronous errors
 * (caught via try-catch) and asynchronous rejections (handled by attaching a .catch to the promise) are forwarded
 * to a centralized error handler.
 *
 * @param handlerFn - The asynchronous callback that processes the API request.
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
