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

// Booking DTOs
export * from "./booking/BookingGetResBodyDTO.js";

// Room DTOs
export * from "./room/RoomGetResBodyOwnerDTO.js";
export * from "./room/RoomGetResBodyNotOwnerDTO.js";

// Identity DTOs
export * from "./identity/IdentityGetResBodyWithAuthDTO.js";
export * from "./identity/IdentityGetResBodyNoAuthDTO.js";
export * from "./identity/IdentityPatchImageVisibilityDTO.js";
export * from "./identity/IdentityPostReqBodyDTO.js";

// Logs DTOs
export * from "./logs/LogPostReqBodyDTO.js";

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
