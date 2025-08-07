import NetworkType from "@/types/NetworkType";
import { instanceToPlain } from "class-transformer";
import Result from "../Result";
import DtoValidationError from "../errors/DtoValidationError";
import { validateSync } from "class-validator";

export default abstract class ADataTransferObj {
  static create(_: object): Result<unknown, DtoValidationError> {
    throw new Error("Unimplemented");
  }

  static fromJson(_: NetworkType): Result<unknown, DtoValidationError> {
    throw new Error("Unimplemented");
  }

  static toJson(_: ADataTransferObj): unknown {
    throw new Error("Unimplemented");
  }

  protected static _create<T extends ADataTransferObj>(obj: T): Result<T, DtoValidationError> {
    const errors = validateSync(this);
    if (errors.length > 0) {
      return Result.err(new DtoValidationError(errors));
    } else {
      return Result.ok(obj);
    }
  }

  protected static _fromJson<T extends ADataTransferObj>(obj: T): Result<T, DtoValidationError> {
    return ADataTransferObj._create(obj);
  }

  protected static _toJson<T extends ADataTransferObj>(obj: T): NetworkType {
    return instanceToPlain(obj);
  }
}
