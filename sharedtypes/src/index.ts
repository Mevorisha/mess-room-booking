// Types
export * from "./types/IdentityPhotosDTO.js";
export * from "./types/MultiSizePhotoDTO.js";
export * from "./types/others.js";
export * from "./types/NetworkType.js";
export * from "./types/Result.js";

// Abstract classes
export * from "./types/abstract/ADataTransferObj.js";

// Error types
export * from "./types/errors/DtoValidationError.js";
export * from "./types/errors/req/IdentityImageReqValidationErrors.js";
export * from "./types/errors/res/IdentityResValidationErrors.js";
export * from "./types/errors/res/RoomResValidationErrors.js";
export * from "./types/errors/res/BookingResValidationErrors.js";

// Booking DTOs
export * from "./booking/res/BookingResReadDTO.js";

// Room DTOs
export * from "./room/res/RoomResReadOwnerDTO.js";
export * from "./room/res/RoomResReadNotOwnerDTO.js";

// Identity DTOs
export * from "./identity/req/IdentityReqReadImage.js";
export * from "./identity/res/IdentityResReadWithAuthDTO.js";
export * from "./identity/res/IdentityResReadNoAuthDTO.js";

// Re-export commonly used validator decorators for convenience
export {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
  IsNotEmpty,
  IsEmail,
  IsUrl,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  MaxLength,
  Min,
  Max,
} from "class-validator";

export { Type, Transform, Exclude, Expose, plainToClass, classToPlain } from "class-transformer";
