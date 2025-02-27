import { getStorage } from "firebase-admin/storage";
import { FirestorePaths } from "../../../../lib/firebaseAdmin/init.js";
import Identity from "../../../../models/Identity.js";

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
    const profile = await Identity.get(uid, ["profilePhotos"]);

    if (!profile?.profilePhotos?.large) {
      res.status(404).json({ message: "Image not found", status: 404 });
    }

    // Redirect to the image URL
    res.redirect(profile?.profilePhotos?.large);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ message: "Failed to fetch image", code: 500 });
  }
}
