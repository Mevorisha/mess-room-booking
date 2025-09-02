import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { authenticate } from "@/middlewares/Auth";
import { StoragePaths } from "@/firebase/init";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { RateLimits } from "@/middlewares/RateLimiter";
import { DocType, HttpMethodTypes, MultiSizeImageSz } from "sharedtypes";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { RequestImageBodyParser } from "@/parsers/RequestImageBodyParser";
import { IdentityRepo } from "@/repo/IdentityRepo";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";
import { ImageUploaderService } from "@/services/ImageUploaderService";

export const config = {
  api: {
    bodyParser: false, // Handle file upload manually
  },
};

/**
 * ```
 * request = "PATCH /api/identityDocs/[uid]/GOV_ID/updateImage"
 *           "Content-Type: image/(jpeg|png)"
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Extract query params from request
  const { uid } = RequestValidationParser.parse({
    req,
    method: HttpMethodTypes.PATCH,
    params: z.object({ uid: CommonZodSchemas.Basic.UID }),
  });

  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.ID_DOC_UPDATE(uid, req, res))) return;

  const imageUploadData = await RequestImageBodyParser.parseOne(req);
  const imagePaths = await ImageUploaderService.upload(imageUploadData, {
    small: StoragePaths.IdentityDocuments.gsBucket(uid, DocType.GOV_ID, MultiSizeImageSz.SMALL),
    medium: StoragePaths.IdentityDocuments.gsBucket(uid, DocType.GOV_ID, MultiSizeImageSz.MEDIUM),
    large: StoragePaths.IdentityDocuments.gsBucket(uid, DocType.GOV_ID, MultiSizeImageSz.LARGE),
  });

  // Update Firestore with image paths
  await IdentityRepo.update(uid, { identityPhotos: { govId: imagePaths, govIdIsPrivate: true } });

  return respond(res, { status: 200, message: "Upload successful" });
});
