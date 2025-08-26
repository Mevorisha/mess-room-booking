import { Type } from "class-transformer";
import { IsOptional, ValidateNested, IsBoolean } from "class-validator";
import { MultiSizePhotoDTO } from "./MultiSizePhotoDTO";
import { ADataTransferObj } from "./abstract/ADataTransferObj";
import { NetworkType } from "./NetworkType";
import { Result } from "./Result";
import { DtoValidationError } from "./errors/DtoValidationError";

interface MultiSizePhotoModel {
  small: string;
  medium: string;
  large: string;
}

interface ConstructorParams {
  workId?: MultiSizePhotoModel;
  govId?: MultiSizePhotoModel;
  workIdIsPrivate?: boolean;
  govIdIsPrivate?: boolean;
}

export class IdentityPhotosDTO extends ADataTransferObj {
  @IsOptional()
  @ValidateNested()
  @Type(() => MultiSizePhotoDTO)
  workId?: MultiSizePhotoDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultiSizePhotoDTO)
  govId?: MultiSizePhotoDTO;

  @IsBoolean()
  workIdIsPrivate = true;

  @IsBoolean()
  govIdIsPrivate = true;

  protected constructor(data?: ConstructorParams) {
    super();

    if (data != null) {
      if (data.workId != null) {
        this.workId = MultiSizePhotoDTO.create(data.workId);
      }
      if (data.govId != null) {
        this.govId = MultiSizePhotoDTO.create(data.govId);
      }
      if (data.workIdIsPrivate != null) {
        this.workIdIsPrivate = data.workIdIsPrivate;
      }
      if (data.govIdIsPrivate != null) {
        this.govIdIsPrivate = data.govIdIsPrivate;
      }
    }
  }

  static override create(data: ConstructorParams): IdentityPhotosDTO {
    const dtoResult = this.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<IdentityPhotosDTO, DtoValidationError> {
    const buildFieldResult = ADataTransferObj._buildDtoFields(json, {
      workId: MultiSizePhotoDTO,
      govId: MultiSizePhotoDTO,
    });

    if (buildFieldResult.isErr) {
      return Result.err(buildFieldResult.error);
    }

    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }
}
