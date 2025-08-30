import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { Result } from "@/types/Result";
import { AcceptGender, AcceptOccupation, QuerySortOrder, RoomSortFields } from "@/types/typeEnums";
import { Exclude } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";

type ConstructorParams = Partial<{
  self: boolean;
  acceptGender: AcceptGender;
  acceptOccupation: AcceptOccupation;
  landmark: string;
  city: string;
  state: string;
  capacity: number;
  lowPrice: number;
  highPrice: number;
  searchTags: string[];
  sortOn: RoomSortFields;
  sortOrder: QuerySortOrder;
  page: number;
  invalidateCache: boolean;
  // used internally
  roomId: string; // used at frontend
  ownerId: string; // used at backend
}>;

export class RoomGetReqQueryParamsWrapper extends ADataTransferObj {
  @Exclude()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  roomId?: string;

  @Exclude()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ownerId?: string;

  @IsOptional()
  @IsEnum(AcceptGender)
  acceptGender?: AcceptGender;

  @IsOptional()
  @IsEnum(AcceptOccupation)
  acceptOccupation?: AcceptOccupation;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  landmark?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  state?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  capacity?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  lowPrice?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  highPrice?: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  searchTags?: string[];

  @IsOptional()
  @IsEnum(RoomSortFields)
  sortOn?: RoomSortFields;

  // DEFAULTS:

  @Exclude()
  private static readonly DEAFULT_PARAMS = new URLSearchParams({
    self: "false",
    sortOrder: QuerySortOrder.ASCENDING,
    page: "1",
    invalidateCache: "true",
  });

  @Exclude()
  private params = new URLSearchParams(RoomGetReqQueryParamsWrapper.DEAFULT_PARAMS);

  // always request rooms in non-owner mode/view
  @IsBoolean()
  self = false;

  // always sort in ascending order (coz default sort field is lastModifiedOn in search sevice)
  @IsEnum(QuerySortOrder)
  sortOrder: QuerySortOrder = QuerySortOrder.ASCENDING;

  // always start at page 1
  @IsInt()
  @IsPositive()
  page = 1;

  // always invalidate cache if not told otherwise
  // ensures latest page is fetched
  @IsBoolean()
  invalidateCache = true;

  private constructor(data?: ConstructorParams | URLSearchParams) {
    super();

    if (data == null) {
      // this.params already initialized
      return;
    } else if (data instanceof URLSearchParams) {
      // this.params already initialized; overwrite params if needed
      for (const [key, val] of data.entries()) {
        this.params.set(key, val);
      }

      if (data.has("self")) {
        this.self = data.get("self") === "true";
      }
      if (data.has("roomId")) {
        this.roomId = data.get("roomId") as string;
      }
      if (data.has("acceptGender")) {
        this.acceptGender = data.get("acceptGender") as AcceptGender;
      }
      if (data.has("acceptOccupation")) {
        this.acceptOccupation = data.get("acceptOccupation") as AcceptOccupation;
      }
      if (data.has("landmark")) {
        this.landmark = data.get("landmark") as string;
      }
      if (data.has("city")) {
        this.city = data.get("city") as string;
      }
      if (data.has("state")) {
        this.state = data.get("state") as string;
      }
      if (data.has("capacity")) {
        this.capacity = Number(data.get("capacity"));
      }
      if (data.has("lowPrice")) {
        this.lowPrice = Number(data.get("lowPrice"));
      }
      if (data.has("highPrice")) {
        this.highPrice = Number(data.get("highPrice"));
      }
      if (data.has("searchTags")) {
        // prettier-ignore
        this.searchTags = data.get("searchTags")?.split(",").map((tag) => tag.trim()) as string[];
      }
      if (data.has("sortOn")) {
        this.sortOn = data.get("sortOn") as RoomSortFields;
      }
      if (data.has("sortOrder")) {
        this.sortOrder = data.get("sortOrder") as QuerySortOrder;
      }
      if (data.has("page")) {
        this.page = Number(data.get("page"));
      }
      if (data.has("invalidateCache")) {
        this.invalidateCache = data.get("invalidateCache") === "true";
      }
    } else {
      this.params = new URLSearchParams();

      if (data.self != null) {
        this.self = data.self;
        this.params.set("self", String(data.self));
      }
      if (data.roomId != null) {
        this.roomId = data.roomId;
        this.params.set("roomId", String(data.roomId));
      }
      if (data.acceptGender != null) {
        this.acceptGender = data.acceptGender;
        this.params.set("acceptGender", String(data.acceptGender));
      }
      if (data.acceptOccupation != null) {
        this.acceptOccupation = data.acceptOccupation;
        this.params.set("acceptOccupation", String(data.acceptOccupation));
      }
      if (data.landmark != null) {
        this.landmark = data.landmark;
        this.params.set("landmark", String(data.landmark));
      }
      if (data.city != null) {
        this.city = data.city;
        this.params.set("city", String(data.city));
      }
      if (data.state != null) {
        this.state = data.state;
        this.params.set("state", String(data.state));
      }
      if (data.capacity != null) {
        this.capacity = data.capacity;
        this.params.set("capacity", String(data.capacity));
      }
      if (data.lowPrice != null) {
        this.lowPrice = data.lowPrice;
        this.params.set("lowPrice", String(data.lowPrice));
      }
      if (data.highPrice != null) {
        this.highPrice = data.highPrice;
        this.params.set("highPrice", String(data.highPrice));
      }
      if (data.searchTags != null) {
        this.searchTags = data.searchTags;
        this.params.set("searchTags", String(data.searchTags.join(",")));
      }
      if (data.sortOn != null) {
        this.sortOn = data.sortOn;
        this.params.set("sortOn", String(data.sortOn));
      }
      if (data.sortOrder != null) {
        this.sortOrder = data.sortOrder;
        this.params.set("sortOrder", String(data.sortOrder));
      }
      if (data.page != null) {
        this.page = data.page;
        this.params.set("page", String(data.page));
      }
      if (data.invalidateCache != null) {
        this.invalidateCache = data.invalidateCache;
        this.params.set("invalidateCache", String(data.invalidateCache));
      }
    }
  }

  static override create(): Result<RoomGetReqQueryParamsWrapper, DtoValidationError>;
  static override create(data: ConstructorParams): Result<RoomGetReqQueryParamsWrapper, DtoValidationError>;
  static override create(data: URLSearchParams): Result<RoomGetReqQueryParamsWrapper, DtoValidationError>;

  static override create(
    data?: ConstructorParams | URLSearchParams
  ): Result<RoomGetReqQueryParamsWrapper, DtoValidationError> {
    // NOT USING fromJson COZ of overloads
    return ADataTransferObj._fromJson(new this(data));
  }

  static fromURL(url?: string, base?: string): Result<RoomGetReqQueryParamsWrapper, DtoValidationError> {
    if (url == null) {
      return Result.err(new DtoValidationError("Missing URL"));
    }
    return ADataTransferObj._fromJson(new this(new URL(url, base).searchParams));
  }

  override toString(): string {
    return this.params.toString();
  }

  get<T extends keyof ConstructorParams>(name: T): NonNullable<ConstructorParams[T]> | null {
    return this[name] ?? null;
  }

  set<T extends keyof ConstructorParams>(name: T, value: NonNullable<ConstructorParams[T]>): void {
    if (Array.isArray(value) && name === "searchTags") {
      this.params.set(name, value.join(","));
    } else {
      this.params.set(name, String(value));
    }
    // jugaar
    this[name] = value as never;
  }

  has<T extends keyof ConstructorParams>(name: T): boolean {
    return this[name] != null;
  }

  delete<T extends keyof ConstructorParams>(name: T): void {
    this.params.delete(name);
    // jugaar :)
    this[name] = void 0 as never;
    delete this[name];
  }

  entries(): [keyof ConstructorParams, string][] {
    return Array.from(this.params.entries()) as [keyof ConstructorParams, string][];
  }

  toQueryParams(): URLSearchParams {
    return new URLSearchParams(this.params);
  }

  clone(): Result<RoomGetReqQueryParamsWrapper, DtoValidationError> {
    return RoomGetReqQueryParamsWrapper.create(this.toQueryParams());
  }
}
