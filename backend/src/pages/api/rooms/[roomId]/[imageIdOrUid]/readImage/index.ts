import z from "zod";
import { NextApiRequest, NextApiResponse } from "next";
import { WithMiddleware } from "@/middlewares/WithMiddleware";
import { StoragePaths } from "@/firebase/init";
import { gsPathToUrl } from "@/models/utils/gsUrlManager";
import { CustomApiError } from "@/types/CustomApiError";
import { RateLimits } from "@/middlewares/RateLimiter";
import { HeaderTypes } from "sharedtypes";
import { CommonZodSchemas } from "@/parsers/CommonZodSchemas";
import { RequestValidationParser } from "@/parsers/RequestValidationParser";

/**
 * ```
 * request = "GET /api/rooms/[roomId]/[imageIdOrUid]/readImage?size=(small|medium|large)&b64=boolean"
 * response = text/plain (base64) is b64 = true, else image/*
 * ```
 */
export default WithMiddleware(async function GET(req: NextApiRequest, res: NextApiResponse) {
  if (!(await RateLimits.ROOM_IMAGE_READ(req, res))) return;
  
  // Extract query params from request
  const { roomId, imageIdOrUid: imageId, size, b64 = false } = RequestValidationParser.parse({
    req,
    method: "GET",
    params: z.object({
      roomId: CommonZodSchemas.Basic.UID,
      imageIdOrUid: CommonZodSchemas.Basic.UID,
      size: CommonZodSchemas.Enum.IMGSIZE,
      b64: CommonZodSchemas.QueryParam.OPTIONAL_BOOL,
    }),
  });

  // Build the GS path for the requested room image
  const gsPath = StoragePaths.RoomPhotos.gsBucket(roomId, imageId, size);

  // Get image direct URL
  const directUrl = await gsPathToUrl(gsPath);

  // Fetch the image
  const response = await fetch(directUrl);
  if (!response.ok) {
    throw CustomApiError.create(404, "Image not found");
  }

  const contentType = response.headers.get(HeaderTypes.CONTENT_TYPE);
  const imageBuffer = await response.arrayBuffer();

  if (b64) {
    res.setHeader(HeaderTypes.CONTENT_TYPE, "text/plain");
    res.setHeader(HeaderTypes.X_CONTENT_ENCODING, "BASE64");
    res.setHeader(HeaderTypes.X_DECODED_CONTENT_TYPE, contentType ?? "application/octet-stream");
    res.send(Buffer.from(imageBuffer).toString("base64"));
  } else {
    res.setHeader(HeaderTypes.CONTENT_TYPE, contentType ?? "application/octet-stream");
    res.send(Buffer.from(imageBuffer));
  }
});
