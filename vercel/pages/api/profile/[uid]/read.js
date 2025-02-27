import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { FirestorePaths } from "../../../../lib/firebaseAdmin/init.js";

export default async function handler(req, res) {
  // Allow only GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed", code: 405 });
  }

  // Extract UID from the query
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ message: "Missing UID", code: 400 });
  }

  try {
    const db = getFirestore();
    const userDoc = await FirestorePaths.Identity(uid).get();

    // Check if user exists
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found", code: 404 });
    }

    const userData = userDoc.data();
    if (!userData) {
      return res
        .status(404)
        .json({ message: "User data not found", code: 404 });
    }

    const { mobile, profilePhotos: profilePhotoPaths } = userData;
    let { firstName, lastName, displayName } = userData;
    if (!displayName) {
      displayName = [firstName, lastName].filter(Boolean).join(" ");
    }

    // Convert profile photo path to a signed URL
    const profilePhotoUrls = {};
    const bucket = getStorage().bucket();
    for (const size of Object.keys(profilePhotoPaths)) {
      const file = bucket.file(profilePhotoPaths[size]);
      profilePhotoUrls[size] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + /* 1 month */ 30 * 24 * 60 * 60 * 1000,
      });
    }

    res.status(200).json({
      displayName: displayName || null,
      mobile: mobile || null,
      profilePhotos: profilePhotoUrls,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", code: 500 });
  }
}
