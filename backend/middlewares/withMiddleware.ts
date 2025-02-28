import { VercelRequest, VercelResponse } from "@vercel/node";
import { cors } from "./cors";

export function withmiddleware(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | undefined>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (!(await cors(req, res))) return;
    return handler(req, res);
  };
}
