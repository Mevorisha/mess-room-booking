import { NextApiRequest, NextApiResponse } from "next";
import Identity, { PsudoFields, SchemaFields } from "@/models/Identity";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { getLoggedInUser } from "@/middlewares/auth";

/**
 * ```
 * import { IdentityType, Language } from "@/models/Identity";
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
export default withmiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
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
    [SchemaFields.IDENTITY_PHOTOS, SchemaFields.LANGUAGE, SchemaFields.TYPE].forEach((type) => fields.push(type));
  }

  const result = await Identity.get(uid, "API_URI", fields);
  if (!result) {
    return respond(res, { status: 404, error: "User not found" });
  }
  return respond(res, { status: 200, json: result });
});
