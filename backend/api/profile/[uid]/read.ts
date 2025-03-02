import { VercelRequest, VercelResponse } from "@vercel/node";
import Identity, { PsudoFields, SchemaFields } from "../../../models/Identity.js";
import { respond } from "../../../modules/utils/respond.js";
import { withmiddleware } from "../../../middlewares/withMiddleware.js";
import { getLoggedInUser } from "../../../middlewares/auth.js";

/**
 * ```
 * import { IdentityType, Language } from "../../../../models/Identity.js";
 *
 * request = "GET /api/profile/[uid]/read"
 *
 * response = {
 *   displayName?: string
 *   firstName?: string
 *   lastName?: string
 *   mobile?: string
 *   profilePhotos?: {
 *     small: string (api uri)
 *     medium: string (api uri)
 *     large: string (api uri)
 *   }
 *
 * < The following need authentication >
 *
 *   type?: IdentityType
 *   language?: Language
 *   identityPhotos?: {
 *     workId?: {
 *       small: string (api uri)
 *       medium: string (api uri)
 *       large: string (api uri)
 *     }
 *     govId?: {
 *       small: string (api uri)
 *       medium: string (api uri)
 *       large: string (api uri)
 *     }
 *     workIdIsPrivate?: boolean
 *     govIdIsPrivate?: boolean
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
