import { IdentityPhotosDTO } from "@/IdentityPhotosDTO";
import MultiSizePhotoDTO from "@/MultiSizePhotoDTO";
import IdentityValidationErrors from "@/types/errors/IdentityValidationErrors";
import { IdentityType, Language } from "@/types/others";
import { Type } from "class-transformer";
import { IsEmail, IsEnum, ValidateNested, IsOptional, IsDateString, IsString, IsBoolean } from "class-validator";
import IdentityReqReadNoAuthDTO from "./IdentityReqReadNoAuthDTO";

export class IdentityReqReadWithAuthDTO extends IdentityReqReadNoAuthDTO {
  @IsEmail({}, { message: IdentityValidationErrors.EMAIL_INVALID })
  email: string;

  @IsEnum(["OWNER", "TENANT"], { message: IdentityValidationErrors.INVALID_IDENTITY_TYPE })
  type: IdentityType;

  @ValidateNested()
  @Type(() => IdentityPhotosDTO)
  identityPhotos: IdentityPhotosDTO;

  @IsOptional()
  @IsEnum(["ENGLISH", "BANGLA", "HINDI"], { message: IdentityValidationErrors.INVALID_LANGUAGE })
  language?: Language;

  @IsDateString({}, { message: IdentityValidationErrors.CREATED_ON_INVALID })
  createdOn: string;

  @IsDateString({}, { message: IdentityValidationErrors.LAST_MODIFIED_ON_INVALID })
  lastModifiedOn: string;

  @IsOptional()
  @IsString({ message: IdentityValidationErrors.TTL_INVALID })
  ttl?: string;

  @IsOptional()
  @IsBoolean({ message: IdentityValidationErrors.IS_DELETED_INVALID })
  isDeleted?: boolean;

  constructor(data: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
    profilePhotos?: MultiSizePhotoDTO;
    email: string;
    type: IdentityType;
    identityPhotos: IdentityPhotosDTO;
    language?: Language;
    createdOn: string;
    lastModifiedOn: string;
    ttl?: string;
    isDeleted?: boolean;
  }) {
    super({
      ...(data.displayName != null && { displayName: data.displayName }),
      ...(data.firstName != null && { firstName: data.firstName }),
      ...(data.lastName != null && { lastName: data.lastName }),
      ...(data.mobile != null && { mobile: data.mobile }),
      ...(data.profilePhotos != null && { profilePhotos: data.profilePhotos }),
    });

    this.email = data.email;
    this.type = data.type;
    this.identityPhotos = data.identityPhotos;
    if (data.language != null) {
      this.language = data.language;
    }
    this.createdOn = data.createdOn;
    this.lastModifiedOn = data.lastModifiedOn;
    if (data.ttl != null) {
      this.ttl = data.ttl;
    }
    if (data.isDeleted != null) {
      this.isDeleted = data.isDeleted;
    }
  }
}
