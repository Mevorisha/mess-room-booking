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
class ProfilePatchLanguageReqBodyDTO extends ADataTransferObj {
  @IsEnum(Language)
  language: Language;

  protected constructor(data: ConditionalParams<ProfilePatchParams.LANGUAGE>) {
    super();
    this.language = data.language;
  }

  static override create(data: ConditionalParams<ProfilePatchParams.LANGUAGE>): ProfilePatchLanguageReqBodyDTO {
    const dtoResult = this.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchLanguageReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<ProfilePatchParams.LANGUAGE>));
  }
}

/**
 * MOBILE DTO
 */
class ProfilePatchMobileReqBodyDTO extends ADataTransferObj {
  @IsMobilePhone()
  mobile: string;

  protected constructor(data: ConditionalParams<ProfilePatchParams.MOBILE>) {
    super();
    this.mobile = data.mobile;
  }

  static override create(data: ConditionalParams<ProfilePatchParams.MOBILE>): ProfilePatchMobileReqBodyDTO {
    const dtoResult = this.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchMobileReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<ProfilePatchParams.MOBILE>));
  }
}

/**
 * NAME DTO
 */
class ProfilePatchNameReqBodyDTO extends ADataTransferObj {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  protected constructor(data: ConditionalParams<ProfilePatchParams.NAME>) {
    super();
    this.firstName = data.firstName;
    this.lastName = data.lastName;
  }

  static override create(data: ConditionalParams<ProfilePatchParams.NAME>): ProfilePatchNameReqBodyDTO {
    const dtoResult = this.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchNameReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<ProfilePatchParams.NAME>));
  }
}

/**
 * TYPE DTO
 */
class ProfilePatchTypeReqBodyDTO extends ADataTransferObj {
  @IsEnum(IdentityType)
  type: IdentityType;

  protected constructor(data: ConditionalParams<ProfilePatchParams.TYPE>) {
    super();
    this.type = data.type;
  }

  static override create(data: ConditionalParams<ProfilePatchParams.TYPE>): ProfilePatchTypeReqBodyDTO {
    const dtoResult = this.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<ProfilePatchTypeReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<ProfilePatchParams.TYPE>));
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ProfilePatchReqBodyDTO {
  export class Language extends ProfilePatchLanguageReqBodyDTO {}
  export class Mobile extends ProfilePatchMobileReqBodyDTO {}
  export class Name extends ProfilePatchNameReqBodyDTO {}
  export class Type extends ProfilePatchTypeReqBodyDTO {}
}
