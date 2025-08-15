import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { IdentityType, Language } from "@/types/typeEnums";
import { Result } from "@/types/Result";
import { IsString, IsNotEmpty, IsMobilePhone, IsEnum } from "class-validator";

export enum ProfilePatchParams {
  LANGUAGE,
  MOBILE,
  NAME,
  TYPE,
}

interface BaseParams {
  language: Language;
  mobile: string;
  firstName: string;
  lastName: string;
  type: IdentityType;
}

type ConditionalParams<T extends ProfilePatchParams> = T extends ProfilePatchParams.LANGUAGE
  ? Pick<BaseParams, "language">
  : T extends ProfilePatchParams.MOBILE
  ? Pick<BaseParams, "mobile">
  : T extends ProfilePatchParams.NAME
  ? Pick<BaseParams, "firstName" | "lastName">
  : T extends ProfilePatchParams.TYPE
  ? Pick<BaseParams, "type">
  : never;

/**
 * LANGUAGE DTO
 */
export class ProfilePatchLanguageReqBodyDTO extends ADataTransferObj {
  @IsEnum(Language)
  language: Language;

  private constructor(data: ConditionalParams<ProfilePatchParams.LANGUAGE>) {
    super();
    this.language = data.language;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchLanguageReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<ProfilePatchParams.LANGUAGE>));
  }

  static override toJson(dto: ProfilePatchLanguageReqBodyDTO): NetworkType {
    return ADataTransferObj._toJson(dto);
  }
}

/**
 * MOBILE DTO
 */
export class ProfilePatchMobileReqBodyDTO extends ADataTransferObj {
  @IsMobilePhone()
  mobile: string;

  private constructor(data: ConditionalParams<ProfilePatchParams.MOBILE>) {
    super();
    this.mobile = data.mobile;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchMobileReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<ProfilePatchParams.MOBILE>));
  }

  static override toJson(dto: ProfilePatchMobileReqBodyDTO): NetworkType {
    return ADataTransferObj._toJson(dto);
  }
}

/**
 * NAME DTO
 */
export class ProfilePatchNameReqBodyDTO extends ADataTransferObj {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  private constructor(data: ConditionalParams<ProfilePatchParams.NAME>) {
    super();
    this.firstName = data.firstName;
    this.lastName = data.lastName;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchNameReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<ProfilePatchParams.NAME>));
  }

  static override toJson(dto: ProfilePatchNameReqBodyDTO): NetworkType {
    return ADataTransferObj._toJson(dto);
  }
}

/**
 * TYPE DTO
 */
export class ProfilePatchTypeReqBodyDTO extends ADataTransferObj {
  @IsEnum(IdentityType)
  type: IdentityType;

  private constructor(data: ConditionalParams<ProfilePatchParams.TYPE>) {
    super();
    this.type = data.type;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchTypeReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<ProfilePatchParams.TYPE>));
  }

  static override toJson(dto: ProfilePatchTypeReqBodyDTO): NetworkType {
    return ADataTransferObj._toJson(dto);
  }
}

/**
 * TYPE MAPPING — alias to get correct DTO based on T
 */
export const ProfilePatchReqBodyDTO = {
  Language: ProfilePatchLanguageReqBodyDTO,
  Mobile: ProfilePatchMobileReqBodyDTO,
  Name: ProfilePatchNameReqBodyDTO,
  Type: ProfilePatchTypeReqBodyDTO,
} as const;
