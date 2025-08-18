import { z } from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { getLoggedInUser } from "@/middlewares/Auth";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { LogPostReqBodyDTO } from "sharedtypes";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { LogsRepo } from "@/repo/LogsRepo";

/**
 * ```
 * request = "POST /api/logs/put?type=(info|error|warn)" { timestamp: string, message: string }
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function POST(req: NextApiRequest, res: NextApiResponse) {
  if (!(await RateLimits.LOG_WRITE(req, res))) return;

  const { type } = RequestValidationParser.parse({
    req,
    method: "POST",
    params: z.object({ type: RequestValidationParser.CommonSchema.ENUM_LOGTYPE }),
  });

  const bodyResult = LogPostReqBodyDTO.fromJson(req.body);
  if (bodyResult.isErr) {
    throw CustomApiError.create(400, "Bad Request", bodyResult.error);
  }
  const { timestamp, message } = bodyResult.value;

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  const uid = authResult.isSuccess() ? authResult.getUid() : "[NO_USER]";

  await LogsRepo.put(uid, { timestamp, message, type });
  return respond(res, { status: 200, message: `Log added on ${timestamp}` });
});
