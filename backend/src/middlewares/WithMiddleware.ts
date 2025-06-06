import { NextApiRequest, NextApiResponse } from "next";
import { cors } from "./Cors";
import { catchAll } from "./ErrorHandler";
import JobScheduler from "@/middlewares/JobScheduler/JobScheduler";
import { scheduleJobs } from "@/middlewares/JobScheduler";
// import { rateLimiter } from "./RateLimiter";

export function WithMiddleware(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<NextApiResponse | undefined | void>
) {
  // wrap API handler in catchAll
  const res = async (req: NextApiRequest, res: NextApiResponse) =>
    catchAll(req, res, async (req: NextApiRequest, res: NextApiResponse) => {
      if (!(await cors(req, res))) return;
      // if (!(await rateLimiter(50, null,  null, req, res))) return;
      return handler(req, res);
    });

  // Schedule all jobs
  scheduleJobs();

  // Run scheduled jobs on each API call
  // This ensures jobs get checked regularly without needing a separate process
  JobScheduler.getInstance()
    .run()
    .then(() => console.log("[I] [WithMiddleware] Invoked JobScheduler"))
    .catch((err) => console.error("[E] [WithMiddleware] JobScheduler:", err));

  // return API handler wrapped in catchAll
  return res;
}
