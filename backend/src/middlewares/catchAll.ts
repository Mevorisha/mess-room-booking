import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { CustomApiError } from "@/lib/utils/ApiError";

export function catchAll(
  req: NextApiRequest,
  res: NextApiResponse,
  handlerFn: (req: NextApiRequest, res: NextApiResponse) => Promise<NextApiResponse | undefined | void>
) {
  try {
    const prom = handlerFn(req, res);
    if (prom instanceof Promise) {
      prom.catch((e) => {
        if (e instanceof CustomApiError) respond(res, { status: e.status, error: e.message });
        else respond(res, { status: 500, error: "Internal Server Error" });
        console.trace(e);
      });
    }
  } catch (e) {
    if (e instanceof CustomApiError) respond(res, { status: e.status, error: e.message });
    else respond(res, { status: 500, error: "Internal Server Error" });
    console.trace(e);
  }
}
