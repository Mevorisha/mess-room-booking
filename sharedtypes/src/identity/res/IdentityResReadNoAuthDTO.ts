import { MultiSizePhotoDTO } from "@/types/MultiSizePhotoDTO";
import { NetworkType } from "@/types/NetworkType";
import { Result } from "@/types/Result";
import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { IdentityResValidationErrors } from "@/types/errors/res/IdentityResValidationErrors";
import { Type } from "class-transformer";
import { IsOptional, IsString, ValidateNested } from "class-validator";

interface ConstructorParams {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  profilePhotos?: MultiSizePhotoDTO;
}

export class IdentityResReadNoAuthDTO extends ADataTransferObj {
  @IsOptional()
  @IsString({ message: IdentityResValidationErrors.DISPLAY_NAME_INVALID })
  displayName?: string;

  @IsOptional()
  @IsString({ message: IdentityResValidationErrors.FIRST_NAME_INVALID })
  firstName?: string;

  @IsOptional()
  @IsString({ message: IdentityResValidationErrors.LAST_NAME_INVALID })
  lastName?: string;

  @IsOptional()
  @IsString({ message: IdentityResValidationErrors.MOBILE_INVALID })
  mobile?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultiSizePhotoDTO)
  profilePhotos?: MultiSizePhotoDTO;

  protected constructor(data?: ConstructorParams) {
    super();
    if (data != null) {
      if (data.displayName != null) {
        this.displayName = data.displayName;
      }
      if (data.firstName != null) {
        this.firstName = data.firstName;
      }
      if (data.lastName != null) {
        this.lastName = data.lastName;
      }
      if (data.mobile != null) {
        this.mobile = data.mobile;
      }
      if (data.profilePhotos != null) {
        this.profilePhotos = data.profilePhotos;
      }
    }
  }

  static override create(data: ConstructorParams): Result<IdentityResReadNoAuthDTO, DtoValidationError> {
    return ADataTransferObj._create(new this(data));
  }

  static override fromJson(data: NetworkType): Result<IdentityResReadNoAuthDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(data as ConstructorParams));
  }

  static override toJson(obj: IdentityResReadNoAuthDTO): NetworkType {
    return ADataTransferObj._toJson(obj);
  }
}
