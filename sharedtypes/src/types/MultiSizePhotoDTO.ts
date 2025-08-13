import { IsNotEmpty, IsString } from "class-validator";
import { ADataTransferObj } from "./abstract/ADataTransferObj";
import { DtoValidationError } from "./errors/DtoValidationError";
import { Result } from "./Result";
import { NetworkType } from "./NetworkType";

interface ConstructorParams {
  small: string;
  medium: string;
  large: string;
}

export type MultiSizeImageSz = keyof ConstructorParams;

export class MultiSizePhotoDTO extends ADataTransferObj {
  @IsString()
  @IsNotEmpty()
  small: string;

  @IsString()
  @IsNotEmpty()
  medium: string;

  @IsString()
  @IsNotEmpty()
  large: string;

  private constructor(data: ConstructorParams) {
    super();

    this.small = data.small;
    this.medium = data.medium;
    this.large = data.large;
  }

  static override fromJson(json: NetworkType): Result<MultiSizePhotoDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }

  static override toJson(dto: MultiSizePhotoDTO): NetworkType {
    return ADataTransferObj._toJson(dto);
  }
}
