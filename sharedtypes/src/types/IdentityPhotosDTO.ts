import { Type } from "class-transformer";
import { IsOptional, ValidateNested, IsBoolean } from "class-validator";
import { MultiSizePhotoDTO, MultiSizePhoto } from "./MultiSizePhotoDTO";
import { ADataTransferObj } from "./abstract/ADataTransferObj";
import { IdentityResValidationErrors } from "./errors/res/IdentityResValidationErrors";

export interface IdentityPhotos {
  workId?: MultiSizePhoto;
  govId?: MultiSizePhoto;
  workIdIsPrivate?: boolean;
  govIdIsPrivate?: boolean;
}

export class IdentityPhotosDTO extends ADataTransferObj implements IdentityPhotos {
  @IsOptional()
  @ValidateNested()
  @Type(() => MultiSizePhotoDTO)
  workId?: MultiSizePhotoDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultiSizePhotoDTO)
  govId?: MultiSizePhotoDTO;

  @IsBoolean({ message: IdentityResValidationErrors.WORK_ID_PRIVATE_INVALID })
  workIdIsPrivate = true;

  @IsBoolean({ message: IdentityResValidationErrors.GOV_ID_PRIVATE_INVALID })
  govIdIsPrivate = true;

  constructor(data?: {
    workId?: MultiSizePhotoDTO;
    govId?: MultiSizePhotoDTO;
    workIdIsPrivate?: boolean;
    govIdIsPrivate?: boolean;
  }) {
    super();

    if (data != null) {
      if (data.workId != null) {
        this.workId = data.workId;
      }
      if (data.govId != null) {
        this.govId = data.govId;
      }
      if (data.workIdIsPrivate != null) {
        this.workIdIsPrivate = data.workIdIsPrivate;
      }
      if (data.govIdIsPrivate != null) {
        this.govIdIsPrivate = data.govIdIsPrivate;
      }
    }
  }
}
