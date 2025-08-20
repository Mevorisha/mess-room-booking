import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { CustomApiError } from "@/types/CustomApiError";
import { logToDb } from "../LogToDb";
import { handleFirebaseIndexError } from "./mkIndex";
import { consoleLog } from "../ConsoleLog";

export type FirebaseIndexErrorType = Error & { code: number; details: string };

async function handleErr(e: FirebaseIndexErrorType | null, res: NextApiResponse) {
  if (e == null) {
    return respond(res, { status: 500, error: "Internal Server Error" });
  }
  if (e instanceof CustomApiError) {
    respond(res, { status: e.status, error: e.message });
    console.error(e);
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
        console.log("[I] [CatchAll] Waiting for index to be created");
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
          .catch((e: FirebaseIndexErrorType) =>
            logToDb(e)
              .then(() => handleErr(e, res))
              .then(() => consoleLog(req, res))
          );
    } catch (e) {
      const error = e as FirebaseIndexErrorType;
      void logToDb(error)
        .then(() => handleErr(error, res))
        .then(() => consoleLog(req, res));
    }
  });
}
