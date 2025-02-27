import { getStorage } from "firebase-admin/storage";
import { FirestorePaths } from "../../../../lib/firebaseAdmin/init.js";

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed", code: 405 });
  }

  // Extract user ID from request
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ message: "User ID is required", code: 400 });
  }

  try {
    // Retrieve image paths from Firestore
    const userDoc = await FirestorePaths.Identity(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found", code: 404 });
    }

    const userData = userDoc.data();
    if (!userData) {
      return res
        .status(404)
        .json({ message: "User data not found", code: 404 });
    }

    if (!userData.image || !userData.image.large) {
      return res.status(404).json({ message: "Image not found", code: 404 });
    }

    // Get image URL from Firebase Storage
    const bucket = getStorage().bucket();
    const file = bucket.file(userData.image.large);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + /* 1 month */ 30 * 24 * 60 * 60 * 1000,
    });

    // Redirect to the image URL
    res.redirect(url);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ message: "Failed to fetch image", code: 500 });
  }
}
