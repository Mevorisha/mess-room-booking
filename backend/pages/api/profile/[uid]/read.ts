import { VercelRequest, VercelResponse } from "@vercel/node";
import Identity, { PsudoFields, SchemaFields } from "../../../../models/Identity.js";
import { respond } from "../../../../lib/utils/respond.js";
import { withmiddleware } from "../../../../middlewares/withMiddleware.js";
import { getLoggedInUser } from "../../../../middlewares/auth.js";

/**
 * ```
 * import { IdentityType, Language } from "../../../../models/Identity.js";
 *
 * request = "GET /api/profile/[uid]/read"
 *
 * response = {
 *   type: IdentityType
 *   displayName?: string
 *   firstName?: string
 *   lastName?: string
 *   mobile?: string
 *   language?: Language
 *   profilePhotos?: {
 *     small: string (direct url)
 *     medium: string (direct url)
 *     large: string (direct url)
 *   }
 * }
 * ```
 */
export default withmiddleware(async function GET(req: VercelRequest, res: VercelResponse) {
  // Allow only GET requests
  if (req.method !== "GET") {
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }
  // Extract UID from the query
  const uid = req.query["uid"] as string;
  if (!uid) {
    return respond(res, { status: 400, error: "Missing field 'uid: string'" });
  }

  const fields = [
    PsudoFields.DISPLAY_NAME,
    SchemaFields.FIRST_NAME,
    SchemaFields.LAST_NAME,
    SchemaFields.MOBILE,
    SchemaFields.PROFILE_PHOTOS,
  ];

  // If logged-in, send additional identity information
  const loggedInUid = await getLoggedInUser(req, res);
  if (loggedInUid === uid) {
    fields.concat([SchemaFields.IDENTITY_PHOTOS, SchemaFields.LANGUAGE, SchemaFields.TYPE]);
  }

  try {
    const result = await Identity.get(uid, "API_URI", fields);
    if (!result) {
      return respond(res, { status: 404, error: "User not found" });
    }
    return respond(res, { status: 200, json: result });
  } catch (e) {
    return respond(res, { status: e.status ?? 500, error: e.message });
  }
});
