import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { IdentityReqValidationErrors } from "@/types/errors/req/IdentityReqValidationErrors";
import { Result } from "@/types/Result";
import { IsNotEmpty, IsString } from "class-validator";
import { ImageUploadedDTO, ImageUploadData } from "@/types/ImageUploadedDTO";
import { IncomingMessage } from "http";
import { NextJsReqQuery } from "@/types/others";

import IncomingForm from "formidable/Formidable";
import formidable from "formidable";
import PersistentFile from "formidable/PersistentFile";

export type ImageUploadRequest = IncomingMessage & { query: NextJsReqQuery };

export class IdentityReqUpdateImage extends ADataTransferObj {
  @IsString({ message: IdentityReqValidationErrors.MISSING_UID })
  @IsNotEmpty({ message: IdentityReqValidationErrors.MISSING_UID })
  uid: string;

  fileBuffer: Buffer<ArrayBufferLike>;

  private constructor(query: NextJsReqQuery, file: ImageUploadedDTO) {
    super();

    this.uid = query["uid"] as string;
    this.fileBuffer = file.getFileBuffer();
  }

  // prettier-ignore
  private static async mkImageUploadedDtoFromReq(req: ImageUploadRequest): Promise<Result<ImageUploadedDTO, DtoValidationError>> { 
    /* eslint-disable */

    // @ts-expect-error - formidable is a Node.js only dependency
    if (typeof window !== "undefined") {
      throw new Error("createFromRequest() is only available in Node.js environment");
    }

    // Dynamic imports to avoid bundling in client-side code
    const formidable = require("formidable").default ?? require("formidable");

    // Parse form data
    const form: IncomingForm = formidable({ multiples: true });

    interface FormParseResult {
      err: Error;
      _files: formidable.Files<"file">;
    }

    const formParseResult = await new Promise<FormParseResult>((resolve, _) =>
      form.parse(req, async (err: Error, _: formidable.Fields<string>, _files: formidable.Files<"file">) =>
        resolve({ err, _files })
      )
    );

    const { err, _files } = formParseResult;
    const files = _files as unknown as Record<string, PersistentFile[]> | null;

    if (err) {
      console.trace(err);
      throw new DtoValidationError({ apiStatusCode: 500, message: "Error parsing file" });
    }

    if (!files) {
      throw new DtoValidationError({ message: "No file uploaded" });
    }

    const pfilesArr = Object.values(files).map((pfiles) => pfiles[0] as PersistentFile);

    if (pfilesArr.length !== 1) {
      throw new DtoValidationError({ message: `Expected 1 file, received ${pfilesArr.length}` });
    }

    const pfile = pfilesArr[0];
    if (!pfile) {
      throw new DtoValidationError({ message: "No file uploaded" });
    }

    const fileJson = pfile.toJSON();

    // Create ImageUploadedDTO from parsed file
    const imageUploadData: ImageUploadData = { filepath: fileJson.filepath };
    if (fileJson.originalFilename != null) {
      imageUploadData.filename = fileJson.originalFilename;
    }
    if (fileJson.mimetype != null) {
      imageUploadData.mimetype = fileJson.mimetype;
    }
    return ImageUploadedDTO.create(imageUploadData);
  }

  /**
   * Create DTO from query and ImageUploadedDTO
   * Use this method when you already have the ImageUploadedDTO instance
   */
  static override async create(req: ImageUploadRequest): Promise<Result<IdentityReqUpdateImage, DtoValidationError>> {
    try {
      if (typeof req.query["uid"] !== "string" || req.query["uid"].length === 0) {
        return Result.err(new DtoValidationError({ message: IdentityReqValidationErrors.MISSING_UID }));
      }
      const imageUploadDto = await this.mkImageUploadedDtoFromReq(req);
      if (imageUploadDto.isErr) {
        return Result.err(imageUploadDto.error);
      }
      return ADataTransferObj._create(new this(req.query, imageUploadDto.value));
    } catch (error: any) {
      return Result.err(new DtoValidationError({ message: error?.message }));
    }
  }
}
