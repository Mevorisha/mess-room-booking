import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { Result } from "@/types/Result";
import { IsString, IsNotEmpty, Matches } from "class-validator";

export enum ImageUploadErrors {
  MISSING_FILENAME = "Missing filename in uploaded image",
  INVALID_MIMETYPE = "Missing mimetype in uploaded image",
  MISSING_FILEPATH = "Missing temporary filepath for uploaded image",
}

interface ConstructorParams {
  filename?: string;
  mimetype?: string;
  filepath: string;
}

export type ImageUploadData = ConstructorParams;

export class ImageUploadedDTO extends ADataTransferObj {
  @IsString({ message: ImageUploadErrors.MISSING_FILENAME })
  @IsNotEmpty({ message: ImageUploadErrors.MISSING_FILENAME })
  filename: string;

  @IsString({ message: ImageUploadErrors.INVALID_MIMETYPE })
  @Matches(/^(image\/(jpeg|png|jpg)|application\/octet-stream)$/, {
    message: ImageUploadErrors.INVALID_MIMETYPE,
  })
  mimetype = "application/octet-stream";

  @IsString({ message: ImageUploadErrors.MISSING_FILEPATH })
  @IsNotEmpty({ message: ImageUploadErrors.MISSING_FILEPATH })
  filepath: string;

  private constructor(data: ConstructorParams) {
    super();

    this.filename = data.filename ?? "unknown";
    this.mimetype = data.mimetype ?? "application/octet-stream";
    this.filepath = data.filepath;
  }

  static override create(data: ConstructorParams): Result<ImageUploadedDTO, DtoValidationError> {
    return ADataTransferObj._create(new this(data));
  }

  static override fromJson(data: NetworkType): Result<ImageUploadedDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(data as ConstructorParams));
  }

  static override toJson(obj: ImageUploadedDTO): NetworkType {
    return ADataTransferObj._toJson(obj);
  }

  /**
   * Helper method to get file buffer from filepath
   * @throws {Error} In browser environment
   */
  getFileBuffer(): Buffer {
    try {
      // eslint-disable-next-line
      const fs = require("fs");
      // eslint-disable-next-line
      return fs.readFileSync(this.filepath);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new Error("getFileBuffer() is not available in browser environment");
    }
  }
}
