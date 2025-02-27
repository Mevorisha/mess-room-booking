import { respond } from "../../../../lib/utils/respond.js";
import { authenticate } from "../../../../middlewares/auth.js";
import Identity from "../../../../models/Identity.js";

export default async function handler(req, res) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method Not Allowed", code: 405 });
  }

  // Require authentication middleware
  await new Promise((resolve, reject) => authenticate(req, res, (err) => (err ? reject(err) : resolve(true))));

  const { uid } = req.query;
  const { type } = req.body;

  if (!uid) {
    return res.status(400).json({ message: "Missing field 'uid: string'", status: 400 });
  }

  if (!type) {
    return res.status(400).json({
      message: "Missing field 'type: OWNER | TENANT'",
      status: 400,
    });
  }

  if (!["OWNER", "TENANT"].includes(type)) {
    return res.status(400).json({
      message: "Invalid field 'type: OWNER | TENANT'",
      status: 400,
    });
  }

  try {
    await Identity.update(uid, { type });
    return res.status(200).json({ message: "Language field updated", status: 200 });
  } catch (e) {
    return respond(res, { status: e.status ?? 500, error: e.message });
  }
}
