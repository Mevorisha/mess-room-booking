import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { IdentityType, Language } from "@/types/others";
import { Result } from "@/types/Result";
import { IsString, IsNotEmpty, IsMobilePhone, IsEnum } from "class-validator";

export type ProfilePatchParams = "language" | "mobile" | "name" | "type";

interface BaseParams {
  language: Language;
  mobile: string;
  firstName: string;
  lastName: string;
  type: IdentityType;
}

type ConditionalParams<T extends ProfilePatchParams> = T extends "language"
  ? Pick<BaseParams, "language">
  : T extends "mobile"
  ? Pick<BaseParams, "mobile">
  : T extends "name"
  ? Pick<BaseParams, "firstName" | "lastName">
  : T extends "type"
  ? Pick<BaseParams, "type">
  : never;

/**
 * LANGUAGE DTO
 */
export class ProfilePatchLanguageReqBodyDTO extends ADataTransferObj {
  @IsEnum(["ENGLISH", "BANGLA", "HINDI"])
  language: Language;

  constructor(data: ConditionalParams<"language">) {
    super();
    this.language = data.language;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchLanguageReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<"language">));
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

  constructor(data: ConditionalParams<"mobile">) {
    super();
    this.mobile = data.mobile;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchMobileReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<"mobile">));
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

  constructor(data: ConditionalParams<"name">) {
    super();
    this.firstName = data.firstName;
    this.lastName = data.lastName;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchNameReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<"name">));
  }

  static override toJson(dto: ProfilePatchNameReqBodyDTO): NetworkType {
    return ADataTransferObj._toJson(dto);
  }
}

/**
 * TYPE DTO
 */
export class ProfilePatchTypeReqBodyDTO extends ADataTransferObj {
  @IsEnum(["OWNER", "TENANT"])
  type: IdentityType;

  constructor(data: ConditionalParams<"type">) {
    super();
    this.type = data.type;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchTypeReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<"type">));
  }

  static override toJson(dto: ProfilePatchLanguageReqBodyDTO): NetworkType {
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
