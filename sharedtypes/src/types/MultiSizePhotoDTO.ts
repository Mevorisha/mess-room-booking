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

export type MultiSizePhoto = ConstructorParams;
export type MultiSizeImageSz = keyof MultiSizePhoto;

export class MultiSizePhotoDTO extends ADataTransferObj implements MultiSizePhoto {
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

  static override create(data: ConstructorParams): Result<MultiSizePhotoDTO, DtoValidationError> {
    return ADataTransferObj._create(new this(data));
  }

  static override fromJson(json: NetworkType): Result<MultiSizePhotoDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as MultiSizePhoto));
  }

  static override toJson(obj: MultiSizePhotoDTO): NetworkType {
    return ADataTransferObj._toJson(obj);
  }
}
