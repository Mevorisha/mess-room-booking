import { IdentityPhotosDTO } from "@/types/IdentityPhotosDTO";
import MultiSizePhotoDTO from "@/types/MultiSizePhotoDTO";
import IdentityResValidationErrors from "@/types/errors/res/IdentityResValidationErrors";
import { IdentityType, Language } from "@/types/others";
import { Type } from "class-transformer";
import { IsEmail, IsEnum, ValidateNested, IsOptional, IsDateString, IsString, IsBoolean } from "class-validator";
import IdentityResReadNoAuthDTO from "./IdentityResReadNoAuthDTO";
import DtoValidationError from "@/types/errors/DtoValidationError";
import NetworkType from "@/types/NetworkType";
import Result from "@/types/Result";
import ADataTransferObj from "@/types/abstract/ADataTransferObj";

interface ConstructorParams {
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
}

export class IdentityResReadWithAuthDTO extends IdentityResReadNoAuthDTO {
  @IsEmail({}, { message: IdentityResValidationErrors.EMAIL_INVALID })
  email: string;

  @IsEnum(["OWNER", "TENANT"], { message: IdentityResValidationErrors.INVALID_IDENTITY_TYPE })
  type: IdentityType = "TENANT";

  @ValidateNested()
  @Type(() => IdentityPhotosDTO)
  identityPhotos: IdentityPhotosDTO;

  @IsEnum(["ENGLISH", "BANGLA", "HINDI"], { message: IdentityResValidationErrors.INVALID_LANGUAGE })
  language: Language = "ENGLISH";

  @IsDateString({}, { message: IdentityResValidationErrors.CREATED_ON_INVALID })
  createdOn: string;

  @IsDateString({}, { message: IdentityResValidationErrors.LAST_MODIFIED_ON_INVALID })
  lastModifiedOn: string;

  @IsOptional()
  @IsString({ message: IdentityResValidationErrors.TTL_INVALID })
  ttl?: string;

  @IsOptional()
  @IsBoolean({ message: IdentityResValidationErrors.IS_DELETED_INVALID })
  isDeleted: boolean;

  private constructor(data: ConstructorParams) {
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
  }

  static override create(data: ConstructorParams): Result<IdentityResReadWithAuthDTO, DtoValidationError> {
    return ADataTransferObj._create(new this(data));
  }

  static override fromJson(data: NetworkType): Result<IdentityResReadWithAuthDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(data as ConstructorParams));
  }

  static override toJson(obj: IdentityResReadWithAuthDTO): NetworkType {
    return ADataTransferObj._toJson(obj);
  }
}
