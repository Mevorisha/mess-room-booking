import { IsString } from "class-validator";

const IMAGES_INVALID = "Images must be valid photo objects";

export default class MultiSizePhotoDTO {
  @IsString({ message: IMAGES_INVALID })
  small: string;

  @IsString({ message: IMAGES_INVALID })
  medium: string;

  @IsString({ message: IMAGES_INVALID })
  large: string;

  constructor(data: { small: string; medium: string; large: string }) {
    this.small = data.small;
    this.medium = data.medium;
    this.large = data.large;
  }
}
