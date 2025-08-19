import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { DocVisibility } from "@/types/typeEnums";
import { Result } from "@/types/Result";
import { IsEnum } from "class-validator";

interface ConstructorParams {
  visibility: DocVisibility;
}

export class IdentityPatchImageVisibilityDTO extends ADataTransferObj {
  @IsEnum(DocVisibility)
  visibility: DocVisibility = DocVisibility.PRIVATE;

  private constructor(data: ConstructorParams) {
    super();
    this.visibility = data.visibility;
  }

  static override fromJson(json: NetworkType): Result<IdentityPatchImageVisibilityDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }
}
