import MultiSizePhotoDTO from "@/types/MultiSizePhotoDTO";
import ADataTransferObj from "@/types/abstract/ADataTransferObj";
import DtoValidationError from "@/types/errors/DtoValidationError";
import IdentityResValidationErrors from "@/types/errors/res/IdentityResValidationErrors";
import { Type } from "class-transformer";
import { IsOptional, IsString, ValidateNested, validateSync } from "class-validator";

export default class IdentityResReadNoAuthDTO extends ADataTransferObj {
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

  constructor(data?: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
    profilePhotos?: MultiSizePhotoDTO;
  }) {
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

    const errors = validateSync(this);
    if (errors.length > 0) {
      throw new DtoValidationError(errors);
    }
  }
}
