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

  type = "EMPTY";

  protected constructor(data: ConstructorParams) {
    super();

    this.email = data.email;
  }

  static override create(data: ConstructorParams): IdentityPostReqBodyDTO {
    const dtoResult = this.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<IdentityPostReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }
}
