import { NextApiRequest, NextApiResponse } from "next";
import Identity, { PsudoFields, SchemaFields } from "@/models/Identity";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { getLoggedInUser } from "@/middlewares/auth";
import { CustomApiError } from "@/lib/utils/ApiError";

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
    throw CustomApiError.create(405, "Method Not Allowed");
  }
  // Extract UID from the query
  const uid = req.query["uid"] as string;
  if (!uid) {
    throw CustomApiError.create(400, "Missing field 'uid: string'");
  }

  const fields = [
    PsudoFields.DISPLAY_NAME,
    SchemaFields.FIRST_NAME,
    SchemaFields.LAST_NAME,
    SchemaFields.MOBILE,
    SchemaFields.PROFILE_PHOTOS,
  ];

  // If logged-in, send additional identity information
  const authResult = await getLoggedInUser(req);
  if (authResult.isSuccess()) {
    const loggedInUid = authResult.getUid();
    if (loggedInUid === uid) {
      [SchemaFields.IDENTITY_PHOTOS, SchemaFields.LANGUAGE, SchemaFields.TYPE].forEach((type) => fields.push(type));
    }
  }

  const result = await Identity.get(uid, "API_URI", fields);
  if (!result) {
    throw CustomApiError.create(404, "User not found");
  }
  return respond(res, { status: 200, json: result });
});
