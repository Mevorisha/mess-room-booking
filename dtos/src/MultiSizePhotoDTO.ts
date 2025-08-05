import { IsString } from "class-validator";
import RoomValidationErrors from "./types/errors/RoomValidationErrors";

export default class MultiSizePhotoDTO {
  @IsString({ message: RoomValidationErrors.IMAGES_INVALID })
  small: string;

  @IsString({ message: RoomValidationErrors.IMAGES_INVALID })
  medium: string;

  @IsString({ message: RoomValidationErrors.IMAGES_INVALID })
  large: string;

  constructor(data: { small: string; medium: string; large: string }) {
    this.small = data.small;
    this.medium = data.medium;
    this.large = data.large;
  }
}
