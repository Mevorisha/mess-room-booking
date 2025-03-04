import { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../lib/utils/respond.js";

export function catchAll(
  req: VercelRequest,
  res: VercelResponse,
  handlerFn: (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | undefined>
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
