import fs from "fs";
import formidable from "formidable";
import { authenticate } from "@/middlewares/auth";
import { FirebaseStorage, StoragePaths } from "@/lib/firebaseAdmin/init";
import { resizeImage } from "@/lib/utils/dataConversion";
import Identity from "@/models/Identity";
import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { withmiddleware } from "@/middlewares/withMiddleware";

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
    return respond(res, { status: 405, error: "Method Not Allowed" });
  }

  const uid = req.query["uid"] as string;
  if (!uid) {
    return respond(res, { status: 400, error: "Missing field 'uid: string'" });
  }
  // Require authentication middleware
  if (!(await authenticate(req, res, uid))) return;

  // Parse form data
  const form = formidable({ multiples: true });
  form.parse(req, async (err: any, _: formidable.Fields<string>, files: formidable.Files<"file">) => {
    // Parsing error
    if (err) {
      console.error(err);
      return respond(res, { status: 500, error: "Error parsing file" });
    }
    // Get file from form data (only 1 file)
    const fileNames = Object.keys(files);
    const file = fileNames.length === 1 && files[fileNames[0]][0];
    if (fileNames.length !== 1) {
      return respond(res, { status: 400, error: `Expected 1 file, received ${fileNames.length}` });
    }
    if (!file) {
      return respond(res, { status: 400, error: "No file uploaded" });
    }
    // File should be JPEG or PNG
    if (file && !/^image\/(jpeg|png|jpg)$/.test(file.mimetype ?? "")) {
      return respond(res, { status: 400, error: `Invalid file type '${file.mimetype}'` });
    }
    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    const resizedImages = await resizeImage(fileBuffer);
    const bucket = FirebaseStorage.bucket();
    // Create upload promise and get image paths
    const imagePaths = { small: "", medium: "", large: "" };
    const uploadPromises = Object.entries(resizedImages).map(([size, imgWithSz]) => {
      const filePath = StoragePaths.IdentityDocuments.gsBucket(uid, "WORK_ID", imgWithSz.sz, imgWithSz.sz);
      imagePaths[size] = filePath;
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
});
