import { StoragePaths } from "@/firebase/init";
import { MultiSizePhotoModel } from "@/models/types";
import { MultiSizeImageSz } from "sharedtypes";

export class RoomTransformer {
  static imgConvertGsPathToApiUri<T extends { images?: MultiSizePhotoModel[] }>(dataToBeUpdated: T, roomId: string): T {
    if (dataToBeUpdated.images != null) {
      // prettier-ignore
      dataToBeUpdated.images = dataToBeUpdated.images.map((imgGsPaths: MultiSizePhotoModel) => ({
      small: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.small), MultiSizeImageSz.SMALL),
      medium: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.medium), MultiSizeImageSz.MEDIUM),
      large: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.large), MultiSizeImageSz.LARGE),
    }));
    }
    return dataToBeUpdated;
  }
}
