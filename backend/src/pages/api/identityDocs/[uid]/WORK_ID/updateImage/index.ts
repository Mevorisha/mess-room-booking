import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { authenticate } from "@/middlewares/Auth";
import { FirebaseStorage, StoragePaths } from "@/firebase/init";
import { resizeImage } from "@/utils/dataConversion";
import Identity from "@/models/Identity";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { RateLimits } from "@/middlewares/RateLimiter";
import { MultiSizePhoto } from "sharedtypes";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";
import { ReuqestImageBodyParser } from "@/parsers/ReuqestImageBodyParser";

export const config = {
  api: {
    bodyParser: false, // Handle file upload manually
  },
};

/**
 * ```
 * request = "PATCH /api/identityDocs/[uid]/WORK_ID/updateImage"
 *           "Content-Type: image/(jpeg|png)"
 * response = { message: string }
 * ```
 */
export default WithMiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Extract query params from request
  const { uid } = RequestValidationParser.parse({
    req,
    method: "PATCH",
    validation: z.object({
      uid: RequestValidationParser.CommonSchema.UID,
    }),
  });

  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.ID_DOC_UPDATE(uid, req, res))) return;

  const { buffer: fileBuffer } = await ReuqestImageBodyParser.parse(req);

  const resizedImages = await resizeImage(fileBuffer);
  const bucket = FirebaseStorage.bucket();

  // Create upload promise and get image paths
  const imagePaths: MultiSizePhoto = { small: "", medium: "", large: "" };
  const uploadPromises = Object.entries(resizedImages).map(([size, imgWithSz]) => {
    const filePath = StoragePaths.IdentityDocuments.gsBucket(uid, "WORK_ID", imgWithSz.sz, imgWithSz.sz);
    imagePaths[size as keyof typeof imagePaths] = filePath;
    const fileRef = bucket.file(filePath);
    return fileRef.save(imgWithSz.img, { contentType: "image/jpeg" });
  });

  // Start upload
  await Promise.all(uploadPromises);

  // Update Firestore with image paths
  await Identity.update(uid, {
    identityPhotos: {
      workId: {
        small: imagePaths.small,
        medium: imagePaths.medium,
        large: imagePaths.large,
      },
      workIdIsPrivate: true,
    },
  });

  return respond(res, { status: 200, message: "Upload successful" });
});
