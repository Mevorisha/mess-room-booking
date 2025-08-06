import { IsString } from "class-validator";
import ADataTransferObj from "./types/abstract/ADataTransferObj";

const IMAGES_INVALID = "Images must be valid photo objects";

export interface MultiSizePhoto {
  small: string;
  medium: string;
  large: string;
}

export default class MultiSizePhotoDTO extends ADataTransferObj implements MultiSizePhoto {
  @IsString({ message: IMAGES_INVALID })
  small: string;

  @IsString({ message: IMAGES_INVALID })
  medium: string;

  @IsString({ message: IMAGES_INVALID })
  large: string;

  constructor(data: { small: string; medium: string; large: string }) {
    super();

    this.small = data.small;
    this.medium = data.medium;
    this.large = data.large;
  }
}
