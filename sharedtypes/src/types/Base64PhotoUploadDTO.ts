import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { Result } from "@/types/Result";
import { IsEnum, IsString, MinLength } from "class-validator";

interface ConstructorParams {
  type: Base64PhotoUploadMimeTypes;
  name?: string;
  base64: string;
}

export enum Base64PhotoUploadMimeTypes {
  JPEG = "image/jpeg",
  JPG = "image/jpg",
  PNG = "image/png",
}

export class Base64PhotoUploadDTO extends ADataTransferObj {
  @IsEnum(Base64PhotoUploadMimeTypes)
  type: Base64PhotoUploadMimeTypes;

  @IsString()
  name = "unknown";

  @IsString()
  @MinLength(100)
  base64: string;

  protected constructor(data: ConstructorParams) {
    super();

    if (data.name != null) {
      this.name = data.name;
    }
    this.type = data.type;
    this.base64 = data.base64;
  }

  static override create(data: ConstructorParams): Result<Base64PhotoUploadDTO, DtoValidationError> {
    return this.fromJson(data);
  }

  static override fromJson(json: NetworkType): Result<Base64PhotoUploadDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }
}
