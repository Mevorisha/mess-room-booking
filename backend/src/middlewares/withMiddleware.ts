import { NextApiRequest, NextApiResponse } from "next";
import { cors } from "./cors";
import { catchAll } from "./catchAll";

export function withmiddleware(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<NextApiResponse | undefined | void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (!(await cors(req, res))) return;
    return catchAll(req, res, handler);
  };
}
