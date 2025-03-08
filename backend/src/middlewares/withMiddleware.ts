import { NextApiRequest, NextApiResponse } from "next";
import { cors } from "./cors";
import { catchAll } from "./catchAll";

export function withmiddleware(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<NextApiResponse | undefined | void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) =>
    catchAll(req, res, async (req: NextApiRequest, res: NextApiResponse) => {
      const continueRes = await cors(req, res);
      if (!continueRes) return;
      return handler(req, res);
    });
}
