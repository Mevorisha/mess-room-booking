import { IsInt, Min, ValidateNested } from "class-validator";
import { ADataTransferObj } from "./abstract/ADataTransferObj";
import { DtoValidationError } from "./errors/DtoValidationError";
import { Exclude, Type } from "class-transformer";
import { NetworkType } from "./NetworkType";
import { Result } from "./Result";

interface ConstructorParams<T> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: T[];
}

export class PaginationDTO<T extends ADataTransferObj> extends ADataTransferObj {
  @IsInt()
  @Min(0)
  currentPage = 0;

  @IsInt()
  @Min(0)
  totalPages = 0;

  @IsInt()
  @Min(0)
  totalItems = 0;

  @ValidateNested({ each: true })
  @Type((options) => (options?.newObject as PaginationDTO<T>).itemsClass)
  items: T[];

  @Exclude()
  private itemsClass: typeof ADataTransferObj;

  private constructor(data: ConstructorParams<T>, tClass: typeof ADataTransferObj) {
    super();

    this.currentPage = data.currentPage;
    this.totalPages = data.totalPages;
    this.totalItems = data.totalItems;
    this.items = data.items;
    this.itemsClass = tClass;
  }

  static createGeneric<T extends ADataTransferObj>(
    data: ConstructorParams<T>,
    itemsClass: typeof ADataTransferObj
  ): PaginationDTO<T> {
    const dtoResult = this.fromJsonWithGeneric<T>(data, itemsClass);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static fromJsonWithGeneric<T extends ADataTransferObj>(
    json: NetworkType,
    itemsClass: typeof ADataTransferObj
  ): Result<PaginationDTO<T>, DtoValidationError> {
    const buildFieldResult = ADataTransferObj._buildDtoFields(json, { items: itemsClass });

    if (buildFieldResult.isErr) {
      return Result.err(buildFieldResult.error);
    }

    return ADataTransferObj._fromJson(new this(json as ConstructorParams<T>, itemsClass));
  }
}
