import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { CustomApiError } from "@/types/CustomApiError";
import { logToDb } from "../LogToDb";
import { handleFbIdxErrOrBuildIdx, isFirebaseIndexError } from "./mkIndex";
import { consoleLog } from "../ConsoleLog";
import { Nullable } from "sharedtypes";

async function handleErr(e: Nullable<Error>, res: NextApiResponse) {
  if (e == null) {
    console.error("[E] [CatchAll] Error object is null");
    return respond(res, { status: 500, error: "Internal Server Error" });
  }
  if (e instanceof CustomApiError) {
    respond(res, { status: e.status, error: e.message });
    console.error(e);
  } else if (isFirebaseIndexError(e)) {
    try {
      const status = await handleFbIdxErrOrBuildIdx(e);
      if (status === "BUILD_IN_PROGRESS" || status === "BUILD_INITIATED") {
        // Index related error, ask user to wait
        respond(res, { status: 500, error: "Server busy. Please try again later." });
        console.log("[I] [CatchAll] Waiting for index to be created");
      } else {
        // Index related error, ask user to wait
        respond(res, { status: 500, error: "Internal Server Error" });
        console.log("[I] [CatchAll] Invalid (non-index) error passed to [HandleFbIdxErrOrBuildIdx]");
      }
    } catch (e) {
      // could call handleErr recursively here but that's a bad idea
      // Error while handling the index related error
      if (e instanceof CustomApiError) {
        // Index related error is a CustomApiError
        respond(res, { status: e.status, error: e.message });
        console.error(e);
      } else {
        // Anything else
        respond(res, { status: 500, error: "Internal Server Error" });
        console.error(e);
      }
    }
  } else {
    // Either not index related error or is not firebase error
    respond(res, { status: 500, error: "Internal Server Error" });
    console.error(e);
  }
}

export function catchAll(
  req: NextApiRequest,
  res: NextApiResponse,
  handlerFn: (req: NextApiRequest, res: NextApiResponse) => Promise<NextApiResponse | undefined | void>
): Promise<void> {
  return new Promise<void>((resolve, _) => {
    try {
      const prom = handlerFn(req, res);
      if (prom instanceof Promise)
        prom
          .then(() => consoleLog(req, res))
          .then(() => resolve())
          .catch((e: Error) =>
            logToDb(e)
              .then(() => handleErr(e, res))
              .then(() => consoleLog(req, res))
          );
    } catch (e) {
      const error = e instanceof Error ? e : CustomApiError.create(500, "Internal Server Error", e);
      void logToDb(error)
        .then(() => handleErr(error, res))
        .then(() => consoleLog(req, res));
    }
  });
}
