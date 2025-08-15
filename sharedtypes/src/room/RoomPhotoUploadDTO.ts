import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { Result } from "@/types/Result";
import { IsString } from "class-validator";

interface ConstructorParams {
  type: string;
  name: string;
  base64: string;
}

export class RoomPhotoUploadDTO extends ADataTransferObj {
  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsString()
  base64: string;

  protected constructor(data: ConstructorParams) {
    super();

    this.name = data.name;
    this.type = data.type;
    this.base64 = data.base64;
  }

  static override fromJson(json: NetworkType): Result<RoomPhotoUploadDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }

  static override toJson(dto: RoomPhotoUploadDTO): NetworkType {
    return ADataTransferObj._toJson(dto);
  }
}
