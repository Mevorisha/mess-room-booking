import admin from "../lib/firebaseAdmin/init.js";

/**
 * Middleware to authenticate Firebase token and get UID.
 */
export async function authenticate(req, res, next) {
  try {
    const token = req.headers["x-firebase-token"];
    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    res.status(403).json({ error: "Unauthorized" });
  }
}
