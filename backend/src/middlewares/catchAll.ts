import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { CustomApiError } from "@/lib/utils/ApiError";

/**
 * Handles API errors by sending an appropriate HTTP response and logging error details.
 *
 * If the error is a CustomApiError, the function responds with the error's specific status and message,
 * and logs these details to the console. For all other errors, it sends a generic 500 Internal Server Error
 * response and logs the error stack trace.
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
 * Executes an API handler and delegates any encountered errors to a centralized error handler.
 *
 * The function wraps the provided handler in a try/catch block to capture both synchronous errors and asynchronous promise rejections.
 * Any error thrown during or after the handler's execution is passed to the error handler function.
 *
 * @param handlerFn - The asynchronous API handler function whose errors will be caught and processed.
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
