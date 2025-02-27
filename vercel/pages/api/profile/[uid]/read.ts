import { VercelRequest, VercelResponse } from "@vercel/node";
import Identity, { PsudoFields, SchemaFields } from "../../../../models/Identity.js";
import { respond } from "../../../../lib/utils/respond.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow only GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed", code: 405 });
  }
  // Extract UID from the query
  const uid = req.query["uid"] as string;
  if (!uid) {
    return respond(res, { status: 400, error: "Missing field 'uid: string'" });
  }
  try {
    const result = await Identity.get(uid, [
      PsudoFields.DISPLAY_NAME,
      SchemaFields.MOBILE,
      SchemaFields.PROFILE_PHOTOS,
      SchemaFields.TYPE,
    ]);
    if (!result) {
      return respond(res, { status: 404, error: "User not found" });
    }
    return respond(res, { status: 200, json: result });
  } catch (e) {
    return respond(res, { status: e.status ?? 500, error: e.message });
  }
}
