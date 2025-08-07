import { IsString } from "class-validator";
import ADataTransferObj from "./abstract/ADataTransferObj";

export enum MultiSizePhotoErrors {
  INVALID_URL = "Image URL should be a string"
}

export interface MultiSizePhoto {
  small: string;
  medium: string;
  large: string;
}

export type MultiSizeImageSz = keyof MultiSizePhoto;

export default class MultiSizePhotoDTO extends ADataTransferObj implements MultiSizePhoto {
  @IsString({ message: MultiSizePhotoErrors.INVALID_URL })
  small: string;

  @IsString({ message: MultiSizePhotoErrors.INVALID_URL })
  medium: string;

  @IsString({ message: MultiSizePhotoErrors.INVALID_URL })
  large: string;

  constructor(data: { small: string; medium: string; large: string }) {
    super();

    this.small = data.small;
    this.medium = data.medium;
    this.large = data.large;
  }
}
