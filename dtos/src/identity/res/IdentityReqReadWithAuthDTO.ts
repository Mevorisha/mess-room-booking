import { IdentityPhotosDTO } from "@/IdentityPhotosDTO";
import MultiSizePhotoDTO from "@/MultiSizePhotoDTO";
import IdentityValidationErrors from "@/types/errors/IdentityValidationErrors";
import { IdentityType, Language } from "@/types/others";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  ValidateNested,
  IsOptional,
  IsDateString,
  IsString,
  IsBoolean,
  validateSync,
} from "class-validator";
import IdentityReqReadNoAuthDTO from "./IdentityReqReadNoAuthDTO";
import DtoValidationError from "@/types/errors/DtoValidationError";

export class IdentityReqReadWithAuthDTO extends IdentityReqReadNoAuthDTO {
  @IsEmail({}, { message: IdentityValidationErrors.EMAIL_INVALID })
  email: string;

  @IsEnum(["OWNER", "TENANT"], { message: IdentityValidationErrors.INVALID_IDENTITY_TYPE })
  type: IdentityType = "TENANT";

  @ValidateNested()
  @Type(() => IdentityPhotosDTO)
  identityPhotos: IdentityPhotosDTO;

  @IsEnum(["ENGLISH", "BANGLA", "HINDI"], { message: IdentityValidationErrors.INVALID_LANGUAGE })
  language: Language = "ENGLISH";

  @IsDateString({}, { message: IdentityValidationErrors.CREATED_ON_INVALID })
  createdOn: string;

  @IsDateString({}, { message: IdentityValidationErrors.LAST_MODIFIED_ON_INVALID })
  lastModifiedOn: string;

  @IsOptional()
  @IsString({ message: IdentityValidationErrors.TTL_INVALID })
  ttl?: string;

  @IsOptional()
  @IsBoolean({ message: IdentityValidationErrors.IS_DELETED_INVALID })
  isDeleted: boolean;

  constructor(data: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
    profilePhotos?: MultiSizePhotoDTO;

    email: string;
    type: IdentityType;
    identityPhotos: IdentityPhotosDTO;
    language: Language;

    createdOn: string;
    lastModifiedOn: string;

    ttl?: string;
  }) {
    const { email, type, identityPhotos, language, createdOn, lastModifiedOn, ttl, ...noAuthData } = data;
    super(noAuthData);

    this.email = email;
    this.type = type;
    this.identityPhotos = identityPhotos;
    this.language = language;
    this.createdOn = createdOn;
    this.lastModifiedOn = lastModifiedOn;
    if (ttl != null) {
      this.ttl = ttl;
    }
    this.isDeleted = ttl != null;

    const errors = validateSync(this);
    if (errors.length > 0) {
      throw new DtoValidationError(errors);
    }
  }
}
