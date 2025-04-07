import { NextApiRequest, NextApiResponse } from "next";
import { respond } from "@/lib/utils/respond";
import { getLoggedInUser } from "@/middlewares/auth";
import Identity, { SchemaFields } from "@/models/Identity";
import { withmiddleware } from "@/middlewares/withMiddleware";
import { CustomApiError } from "@/lib/utils/ApiError";
import Room, { RoomCreateData } from "@/models/Room";
import Joi from "joi";
import { resizeImageOneSz } from "@/lib/utils/dataConversion";
import { FirebaseStorage, StoragePaths } from "@/lib/firebaseAdmin/init";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Set desired value here
    },
  },
};

/**
 * @throws {CustomApiError} On joi validation failure
 */
function createRoomData(req: NextApiRequest): [RoomCreateData, Array<{ type: string; name: string; base64: string }>] {
  const roomCreateSchema = Joi.object({
    ownerId: Joi.string().trim().required(),
    acceptGender: Joi.string().valid("MALE", "FEMALE", "OTHER").required(),
    acceptOccupation: Joi.string().valid("STUDENT", "PROFESSIONAL", "ANY").required(),
    searchTags: Joi.array().items(Joi.string().trim().required()).required(),
    landmark: Joi.string().trim().required(),
    address: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    majorTags: Joi.array().items(Joi.string().trim().required()).required(),
    minorTags: Joi.array().items(Joi.string().trim()).min(0).required(),
    capacity: Joi.number().integer().positive().required(),
    pricePerOccupant: Joi.number().positive().required(),
    files: Joi.array()
      .items(
        Joi.object({
          type: Joi.string().required(),
          name: Joi.string().required(),
          base64: Joi.string()
            .pattern(/^[A-Za-z0-9+/=]+$/)
            .required(),
        })
      )
      .min(0)
      .required(),
  });

  const { error, value } = roomCreateSchema.validate(req.body);

  if (error) {
    throw CustomApiError.create(400, `Validation error: ${error.message}`);
  }

  const roomCreateData = {
    ...value,
    searchTags: new Set(value.searchTags),
    majorTags: new Set(value.majorTags),
    minorTags: new Set(value.minorTags),
  };

  delete roomCreateData.files;

  return [roomCreateData, value.files];
}

/**
 * ```
 * request = "POST /api/rooms/create" {
 *   acceptGender: "MALE" | "FEMALE" | "OTHER"
 *   acceptOccupation: "STUDENT" | "PROFESSIONAL" | "ANY"
 *   searchTags: Set<string>
 *   landmark: string
 *   address: string
 *   city: string
 *   state: string
 *   majorTags: Set<string>
 *   minorTags: Set<string>
 *   capacity: number
 *   pricePerOccupant: number
 *   files: Array<{ type: string, name: string, base64: string }>
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

  req.body.ownerId = uid;
  const [roomData, images] = createRoomData(req);
  const roomId = await Room.create(roomData);

  // at this point no need to add guards for images.length == 0
  // coz while it does end up creating a large array (and ill optimize it later)
  // the update after the loop sets isUnavailable to false, which is needed

  // Create images for the room
  const bucket = FirebaseStorage.bucket();
  // Array for all images, each entry is for a single imageId (1 size only, 500px)
  const uploadPromises: Promise<void>[] = [];
  // Array of respective image gs bucket paths
  const imagePaths = new Array<string>(images.length);
  // For each image from request
  for (let i = 0; i < images.length; ++i) {
    const { type, base64 } = images[i];
    if (!/^image\/(jpeg|png|jpg)$/.test(type)) {
      return respond(res, { status: 400, error: `Invalid file type '${type}'` });
    }
    // Convert from b64 and resize to 500
    const { img: fileBuffer, sz: _ } = await resizeImageOneSz<500>(Buffer.from(base64, "base64"), 500);
    const imageId = "" + Date.now();
    const filePath = StoragePaths.RoomPhotos.gsBucket(roomId, imageId);
    // Save gs file path
    imagePaths[i] = filePath;
    const fileRef = bucket.file(filePath);
    // Push promise for async upload
    uploadPromises.push(fileRef.save(fileBuffer, { contentType: "image/jpeg" }));
  }
  // Upload all to gs bucket
  await Promise.all(uploadPromises);

  await Room.update(roomId, { images: imagePaths, isUnavailable: false });

  return respond(res, { status: 200, json: { roomId } });
});
