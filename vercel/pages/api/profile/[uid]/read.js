import Identity from "../../../../models/Identity.js";

export default async function handler(req, res) {
  // Allow only GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed", code: 405 });
  }

  // Extract UID from the query
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ message: "Missing field 'uid: string'", code: 400 });
  }

  try {
    const result = await Identity.get(uid, [
      "displayName",
      "mobile",
      "profilePhotos",
      "type",
    ]);

    if (!result) {
      res.status(404).json({ message: "User not found", status: 404 });
    }

    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", code: 500 });
  }
}
