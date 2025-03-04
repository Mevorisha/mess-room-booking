import fs from "fs";
import formidable from "formidable";
import { getStorage } from "firebase-admin/storage";
import { authenticate } from "../../../middlewares/auth.js";
import { StoragePaths } from "../../../lib/firebaseAdmin/init.js";
import { resizeImage } from "../../../lib/utils/dataConversion.js";
import Identity from "../../../models/Identity.js";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { respond } from "../../../lib/utils/respond.js";
import { withmiddleware } from "../../../middlewares/withMiddleware.js";

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
export default withmiddleware(async function PATCH(req: VercelRequest, res: VercelResponse) {
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
  const form = formidable({ multiples: false });
  form.parse(req, async (err: any, fields: any, files: { file: any[] }) => {
    // Parsing error
    if (err) {
      return respond(res, { status: 500, error: "Error parsing file" });
    }
    // Get file from form data (only 1 file)
    const file = files.file && files.file[0];
    if (!file) {
      return respond(res, { status: 400, error: "No file uploaded" });
    }
    // File should be JPEG or PNG
    if (file && !/^image\/(jpeg|png)$/.test(file.mimetype ?? "")) {
      return respond(res, { status: 400, error: "Invalid file type" });
    }
    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);
    try {
      const resizedImages = await resizeImage(fileBuffer);
      const bucket = getStorage().bucket();
      // Create upload promise and get image paths
      const imagePaths = { small: "", medium: "", large: "" };
      const uploadPromises = Object.entries(resizedImages).map(([size, imgWithSz]) => {
        const filePath = StoragePaths.ProfilePhotos.gsBucket(uid, imgWithSz.sz, imgWithSz.sz);
        imagePaths[size] = filePath;
        const fileRef = bucket.file(filePath);
        return fileRef.save(imgWithSz.img, { contentType: "image/jpeg" });
      });
      // Start upload
      await Promise.all(uploadPromises);
      // Update Firestore with image paths
      await Identity.update(uid, {
        profilePhotos: {
          small: imagePaths.small,
          medium: imagePaths.medium,
          large: imagePaths.large,
        },
      });

      return respond(res, { status: 200, error: "Field profilePhotos updated" });
    } catch (e) {
      return respond(res, { status: e.status ?? 500, error: e.message });
    }
  });
});
