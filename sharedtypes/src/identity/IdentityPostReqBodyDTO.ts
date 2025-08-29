import { NetworkType } from "@/types/NetworkType";
import { Result } from "@/types/Result";
import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { IsEmail } from "class-validator";

interface ConstructorParams {
  email: string;
}

export class IdentityPostReqBodyDTO extends ADataTransferObj {
  @IsEmail()
  email: string;

  protected constructor(data: ConstructorParams) {
    super();

    this.email = data.email;
  }

  static override create(data: ConstructorParams): Result<IdentityPostReqBodyDTO, DtoValidationError> {
    return this.fromJson(data);
  }

  static override fromJson(json: NetworkType): Result<IdentityPostReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }
}
