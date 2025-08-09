import { authenticate } from "@/middlewares/Auth";
import { FirebaseStorage, StoragePaths } from "@/firebase/init";
import { resizeImage } from "@/utils/dataConversion";
import Identity from "@/models/Identity";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/utils/respond";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { IdentityReqUpdateImage } from "sharedtypes";

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
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  if (req.query["uid"] == null) {
    throw CustomApiError.create(400, "Missing field 'uid: string'");
  }

  const uid = req.query["uid"] as string;

  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.ID_DOC_UPDATE(uid, req, res))) return;

  const uploadRequestRes = await IdentityReqUpdateImage.create(req);
  if (uploadRequestRes.isErr) {
    throw CustomApiError.create(uploadRequestRes.error.apiStatusCode, uploadRequestRes.error.message);
  }

  const { fileBuffer } = uploadRequestRes.value;

  const resizedImages = await resizeImage(fileBuffer);
  const bucket = FirebaseStorage.bucket();
  // Create upload promise and get image paths
  const imagePaths = { small: "", medium: "", large: "" };
  const uploadPromises = Object.entries(resizedImages).map(([size, imgWithSz]) => {
    const filePath = StoragePaths.IdentityDocuments.gsBucket(uid, "GOV_ID", imgWithSz.sz, imgWithSz.sz);
    imagePaths[size as keyof typeof imagePaths] = filePath;
    const fileRef = bucket.file(filePath);
    return fileRef.save(imgWithSz.img, { contentType: "image/jpeg" });
  });

  // Start upload
  await Promise.all(uploadPromises);

  // Update Firestore with image paths
  await Identity.update(uid, {
    identityPhotos: {
      govId: {
        small: imagePaths.small,
        medium: imagePaths.medium,
        large: imagePaths.large,
      },
      govIdIsPrivate: true,
    },
  });

  return respond(res, { status: 200, message: "Upload successful" });
});
