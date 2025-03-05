import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";

export function catchAll(
  req: NextApiRequest,
  res: NextApiResponse,
  handlerFn: (req: NextApiRequest, res: NextApiResponse) => Promise<NextApiResponse | undefined | void>
) {
  try {
    const prom = handlerFn(req, res);
    if (prom instanceof Promise) {
      prom.catch((e) => {
        respond(res, { status: 500, error: "Internal Server Error" });
        console.error(e);
      });
    }
  } catch (e) {
    respond(res, { status: 500, error: "Internal Server Error" });
    console.error(e);
  }
}
