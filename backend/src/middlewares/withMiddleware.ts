import { NextApiRequest, NextApiResponse } from "next";
import { cors } from "./cors";
import { catchAll } from "./catchAll";
import JobScheduler from "@/lib/utils/JobScheduler";
import { scheduleJobs } from "./scheduleJobs";
// import { rateLimiter } from "./rateLimit";

export function withmiddleware(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<NextApiResponse | undefined | void>
) {
  // wrap API handler in catchAll
  const res = async (req: NextApiRequest, res: NextApiResponse) =>
    catchAll(req, res, async (req: NextApiRequest, res: NextApiResponse) => {
      if (!(await cors(req, res))) return;
      // if (!(await rateLimiter(50, null, req, res))) return;
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
