import fs from "fs";
import formidable from "formidable";
import { authenticate } from "@/middlewares/auth";
import { FirebaseStorage, StoragePaths } from "@/lib/firebaseAdmin/init";
import { resizeImage } from "@/lib/utils/dataConversion";
import Identity from "@/models/Identity";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";
import FormParseResult from "@/lib/types/IFormParseResult";
import { CustomApiError } from "@/lib/utils/ApiError";
import { RateLimits } from "@/middlewares/rateLimit";
import PersistentFile from "formidable/PersistentFile";

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
export default withmiddleware(async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  const uid = req.query["uid"] as string;
  if (!uid) {
    throw CustomApiError.create(400, "Missing field 'uid: string'");
  }
  // Require authentication middleware
  await authenticate(req, uid);

  if (!(await RateLimits.ID_DOC_UPDATE(uid, req, res))) return;

  // Parse form data
  const form = formidable({ multiples: true });

  const formParsePromise = new Promise<FormParseResult>((resolve, _) => {
    form.parse(req, async (err: any, fields: formidable.Fields<string>, files: formidable.Files<"file">) => {
      resolve({ err, fields, files });
    });
  });

  const { err, files: _files } = await formParsePromise; // prettier-ignore
  const files = _files as Record<string, PersistentFile[]> | null;
  if (err) {
    console.trace(err);
    throw CustomApiError.create(500, "Error parsing file");
  }
  if (!files) {
    throw CustomApiError.create(400, "No file uploaded");
  }
  const pfilesArr = Object.values(files).map((pfiles) => pfiles[0] as PersistentFile);
  if (pfilesArr.length !== 1) {
    console.log(pfilesArr.length);
    return respond(res, { status: 400, error: `Expected 1 file, received ${pfilesArr.length}` });
  }
  const pfile = pfilesArr[0];
  if (!pfile) {
    throw CustomApiError.create(400, "No file uploaded");
  }
  const fileJson = pfile.toJSON();
  // File should be JPEG or PNG
  if (!/^image\/(jpeg|png|jpg)$/.test(fileJson.mimetype ?? "application/octet-stream")) {
    return respond(res, { status: 400, error: `Invalid file type '${fileJson.mimetype}'` });
  }
  // Read file buffer
  const fileBuffer = fs.readFileSync(fileJson.filepath);
  const resizedImages = await resizeImage(fileBuffer);
  const bucket = FirebaseStorage.bucket();
  // Create upload promise and get image paths
  const imagePaths = { small: "", medium: "", large: "" };
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
