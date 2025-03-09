import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { getLoggedInUser } from "@/middlewares/auth";
import Identity, { SchemaFields } from "@/models/Identity";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";
import Room, { RoomCreateData } from "@/models/Room";
import Joi from "joi";

/**
 * @throws {CustomApiError} On joi validation failure
 */
function createRoomData(req: NextApiRequest): RoomCreateData {
  const roomCreateSchema = Joi.object({
    ownerId: Joi.string().trim().required(),
    acceptGender: Joi.string().valid("MALE", "FEMALE", "OTHER").required(),
    acceptOccupation: Joi.string().valid("STUDENT", "PROFESSIONAL", "ANY").required(),
    landmarkTags: Joi.array().items(Joi.string().trim().required()).required(),
    address: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    majorTags: Joi.array().items(Joi.string().trim().required()).required(),
    minorTags: Joi.array().items(Joi.string().trim().required()).required(),
    capacity: Joi.number().integer().positive().required(),
    pricePerOccupant: Joi.number().positive().required(),
  });

  const { error, value } = roomCreateSchema.validate(req.body);

  if (error) {
    throw CustomApiError.create(400, `Validation error: ${error.message}`);
  }

  return {
    ...value,
    landmarkTags: new Set(value.landmarkTags),
    majorTags: new Set(value.majorTags),
    minorTags: new Set(value.minorTags),
  };
}

/**
 * ```
 * request = "POST /api/rooms/create" {
 *   ownerId: string
 *   acceptGender: "MALE" | "FEMALE" | "OTHER"
 *   acceptOccupation: "STUDENT" | "PROFESSIONAL" | "ANY"
 *   landmarkTags: Set<string>
 *   address: string
 *   city: string
 *   state: string
 *   majorTags: Set<string>
 *   minorTags: Set<string>
 *   capacity: number
 *   pricePerOccupant: number
 * }
 * response = { roomId: string }
 * ```
 */
export default withmiddleware(async function POST(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== "POST") {
    throw CustomApiError.create(405, "Method Not Allowed");
  }

  // Auth middleware to get user
  const authResult = await getLoggedInUser(req);
  // Automatically throws ApiError and is caught by catchAll (middleware)
  const uid = authResult.getUid();

  const profile = await Identity.get(uid, "GS_PATH", [SchemaFields.TYPE]);
  if (!profile) {
    throw CustomApiError.create(404, "User not found");
  }
  if (profile.type !== "OWNER") {
    throw CustomApiError.create(403, "Please switch profile type to OWNER before creating a room");
  }

  const roomData = createRoomData(req);
  const roomId = await Room.create(roomData);

  return respond(res, { status: 200, json: { roomId } });
});
