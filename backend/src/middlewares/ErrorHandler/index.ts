import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { CustomApiError } from "@/types/CustomApiError";
import { logToDb } from "../LogToDb";
import { handleFirebaseIndexError } from "./mkIndex";

async function handleErr(e: any, res: NextApiResponse) {
  if (!e) {
    return respond(res, { status: 500, error: "Unknown Server Error" });
  }
  if (e instanceof CustomApiError) {
    respond(res, { status: e.status, error: e.message });
    console.error(e.status, e.message);
  } else {
    try {
      const isErrorHandled = await handleFirebaseIndexError(e);
      if (!isErrorHandled) {
        // Not an index related error
        respond(res, { status: 500, error: "Internal Server Error" });
        console.error(e);
      } else {
        // Index related error, ask user to wait
        respond(res, { status: 500, error: "Server busy. Please try again later." });
        console.error("[I] [CatchAll] Waiting for index to be created");
      }
    } catch (e) {
      // could call handleErr recursively here but that's a bad idea
      // Error while handling the index related error
      if (e instanceof CustomApiError) {
        // Index related error is a CustomApiError
        respond(res, { status: e.status, error: e.message });
        console.error(e.status, e.message);
      } else {
        // Anything else
        respond(res, { status: 500, error: "Internal Server Error" });
        console.error(e);
      }
    }
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
