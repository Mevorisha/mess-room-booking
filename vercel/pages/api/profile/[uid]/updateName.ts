import { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../../../../lib/utils/respond.js";
import { authenticate } from "../../../../middlewares/auth.js";
import Identity from "../../../../models/Identity.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }
  // Require authentication middleware
  if (!(await authenticate(req, res))) return;

  const uid = req.query["uid"] as string;
  const firstName = req.body["firstName"] as string;
  const lastName = req.body["lastName"] as string;
  if (!uid) {
    return respond(res, { status: 400, error: "Missing field 'uid: string'" });
  }
  if (!firstName) {
    return respond(res, { status: 400, error: "Missing field 'firstName: string'" });
  }
  if (!lastName) {
    return respond(res, { status: 400, error: "Missing field 'lastName: string'" });
  }
  try {
    await Identity.update(uid, { firstName, lastName });
    return respond(res, { status: 200, error: "Fields 'firstName' and 'lastName' updated" });
  } catch (e) {
    return respond(res, { status: e.status ?? 500, error: e.message });
  }
}
