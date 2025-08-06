import { Type } from "class-transformer";
import { IsOptional, ValidateNested, IsBoolean } from "class-validator";
import MultiSizePhotoDTO, { MultiSizePhoto } from "./MultiSizePhotoDTO";
import ADataTransferObj from "./types/abstract/ADataTransferObj";
import IdentityValidationErrors from "./types/errors/IdentityValidationErrors";

export interface IdentityPhotos {
  workId?: MultiSizePhoto;
  govId?: MultiSizePhoto;
  workIdIsPrivate: boolean;
  govIdIsPrivate: boolean;
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

  @IsOptional()
  @IsBoolean({ message: IdentityValidationErrors.WORK_ID_PRIVATE_INVALID })
  workIdIsPrivate = false;

  @IsOptional()
  @IsBoolean({ message: IdentityValidationErrors.GOV_ID_PRIVATE_INVALID })
  govIdIsPrivate = false;

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
