import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { authenticate } from "@/middlewares/Auth";
import { FirebaseStorage, StoragePaths } from "@/firebase/init";
import { resizeImage } from "@/utils/dataConversion";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { RateLimits } from "@/middlewares/RateLimiter";
import { MultiSizeImageSz } from "sharedtypes";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { RequestImageBodyParser } from "@/parsers/RequestImageBodyParser";
import { IdentityRepo } from "@/repo/IdentityRepo";
import { MultiSizePhotoModel } from "@/models/types";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";

export const config = {
  api: {
    bodyParser: false, // Handle file upload manually
  },
};

/**
 * ```
 * request = "PATCH /api/profile/[uid]/updatePhoto"
 *           "Content-Type: image/(jpeg|png)"
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Extract query params from request
  const { uid } = RequestValidationParser.parse({
    req,
    method: "PATCH",
    params: z.object({ uid: CommonZodSchemas.Basic.UID }),
  });

  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.ID_DOC_UPDATE(uid, req, res))) return;

  const { buffer: fileBuffer } = await RequestImageBodyParser.parse(req);

  const resizedImages = await resizeImage(fileBuffer);
  const bucket = FirebaseStorage.bucket();

  // Create upload promise and get image paths
  const imagePaths: MultiSizePhotoModel = { small: "", medium: "", large: "" };
  const uploadPromises = Object.entries(resizedImages).map(([size, imgWithSz]) => {
    const filePath = StoragePaths.ProfilePhotos.gsBucket(uid, imgWithSz.sz, imgWithSz.sz);
    imagePaths[size as MultiSizeImageSz] = filePath;
    const fileRef = bucket.file(filePath);
    // always save jpeg for consistency and security
    return fileRef.save(imgWithSz.img, { contentType: "image/jpeg" });
  });

  // Start upload
  await Promise.all(uploadPromises);

  // Update Firestore with image paths
  await IdentityRepo.update(uid, {
    profilePhotos: {
      small: imagePaths.small,
      medium: imagePaths.medium,
      large: imagePaths.large,
    },
  });

  return respond(res, { status: 200, error: "Field 'profilePhotos' updated" });
});
