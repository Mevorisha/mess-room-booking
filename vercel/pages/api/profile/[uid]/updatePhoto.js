import fs from "fs";
import formidable from "formidable";
import { getStorage } from "firebase-admin/storage";
import { authenticate } from "../../../../middlewares/auth.js";
import {
  FirestorePaths,
  StoragePaths,
} from "../../../../lib/firebaseAdmin/init.js";
import { resizeImage } from "../../../../lib/utils/dataConversion.js";

export const config = {
  api: {
    bodyParser: false, // Handle file upload manually
  },
};

export default async function handler(req, res) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method Not Allowed", code: 405 });
  }

  // Require authentication middleware
  await new Promise((resolve, reject) =>
    authenticate(req, res, (err) => (err ? reject(err) : resolve(true)))
  );

  // Parse form data
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    // Parsing error
    if (err) {
      return res.status(500).json({ message: "Error parsing file", code: 500 });
    }

    // Get file from form data (only 1 file)
    const file = files.file && files.file[0];

    if (!file) {
      return res.status(400).json({ message: "No file uploaded", code: 400 });
    }

    // File should be JPEG or PNG
    if (file && !/^image\/(jpeg|png)$/.test(file.mimetype ?? "")) {
      return res.status(400).json({ message: "Invalid file type", code: 400 });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    try {
      const resizedImages = await resizeImage(fileBuffer);
      const bucket = getStorage().bucket();
      const imagePaths = {};
      const uploadPromises = Object.entries(resizedImages).map(
        ([size, buffer]) => {
          const filePath = StoragePaths.ProfilePhotos(req.uid, size, size);
          imagePaths[size] = filePath;

          const fileRef = bucket.file(filePath);
          return fileRef.save(buffer, { contentType: "image/jpeg" });
        }
      );

      await Promise.all(uploadPromises);

      // Update Firestore with image paths
      await FirestorePaths.Identity(req.uid).set(
        {
          image: {
            small: imagePaths.image30px,
            medium: imagePaths.image90px,
            large: imagePaths.image500px,
          },
        },
        { merge: true }
      );

      res.status(200).json({ message: "Upload successful", code: 200 });
    } catch (error) {
      res.status(500).json({ message: "Failed to process image", code: 500 });
    }
  });
}
