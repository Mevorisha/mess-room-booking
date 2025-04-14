import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { CustomApiError } from "@/lib/utils/ApiError";
import { logToDb } from "./logToDb";

function handleErr(e: any, res: NextApiResponse) {
  if (!e) {
    return respond(res, { status: 500, error: "Unknown" });
  }
  if (e instanceof CustomApiError) {
    respond(res, { status: e.status, error: e.message });
    console.error(e.status, e.message);
  } else {
    respond(res, { status: 500, error: "Internal Server Error" });
    console.trace(e);
  }
}

export function catchAll(
  req: NextApiRequest,
  res: NextApiResponse,
  handlerFn: (req: NextApiRequest, res: NextApiResponse) => Promise<NextApiResponse | undefined | void>
) {
  try {
    const prom = handlerFn(req, res);
    if (prom instanceof Promise) prom.catch((e) => logToDb(e).then(() => handleErr(e, res)));
  } catch (e) {
    logToDb(e as Error).then(() => handleErr(e, res));
  }
}
