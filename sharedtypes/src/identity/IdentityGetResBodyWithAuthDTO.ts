import { IdentityPhotosDTO } from "@/types/IdentityPhotosDTO";
import { MultiSizePhotoDTO } from "@/types/MultiSizePhotoDTO";
import { IdentityType, Language } from "@/types/typeEnums";
import { Type } from "class-transformer";
import { IsEmail, IsEnum, ValidateNested, IsOptional, IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { IdentityGetResBodyNoAuthDTO } from "./IdentityGetResBodyNoAuthDTO";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { Result } from "@/types/Result";
import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";

interface ConstructorParams {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  profilePhotos?: MultiSizePhotoDTO;

  email: string;
  type: IdentityType;
  identityPhotos?: IdentityPhotosDTO;
  language: Language;

  createdOn: string;
  lastModifiedOn: string;

  ttl?: string;
}

export class IdentityGetResBodyWithAuthDTO extends IdentityGetResBodyNoAuthDTO {
  @IsEmail()
  email: string;

  @IsEnum(IdentityType)
  type: IdentityType = IdentityType.TENANT;

  @IsOptional()
  @ValidateNested()
  @Type(() => IdentityPhotosDTO)
  identityPhotos?: IdentityPhotosDTO;

  @IsEnum(Language)
  language: Language = Language.ENGLISH;

  @IsString()
  @IsNotEmpty()
  createdOn: string;

  @IsString()
  @IsNotEmpty()
  lastModifiedOn: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ttl?: string;

  @IsBoolean()
  isDeleted = false;

  private constructor(data: ConstructorParams) {
    const { email, type, identityPhotos, language, createdOn, lastModifiedOn, ttl, ...noAuthData } = data;
    super(noAuthData);

    this.email = email;
    this.type = type;
    if (identityPhotos != null) {
      this.identityPhotos = identityPhotos;
    }
    this.language = language;
    this.createdOn = createdOn;
    this.lastModifiedOn = lastModifiedOn;
    if (ttl != null) {
      this.ttl = ttl;
    }
    this.isDeleted = ttl != null;
  }

  static override fromJson(json: NetworkType): Result<IdentityGetResBodyWithAuthDTO, DtoValidationError> {
    const buildFieldResult = ADataTransferObj._buildDtoFields(json, {
      profilePhotos: MultiSizePhotoDTO,
      identityPhotos: IdentityPhotosDTO,
    });

    if (buildFieldResult.isErr) {
      return Result.err(buildFieldResult.error);
    }
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }
}
