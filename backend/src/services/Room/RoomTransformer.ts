import { StoragePaths } from "@/firebase/init";
import { MultiSizePhotoModel } from "@/models/types";

export class RoomTransformer {
  static imgConvertGsPathToApiUri<T extends { images?: MultiSizePhotoModel[] }>(dataToBeUpdated: T, roomId: string): T {
    if (dataToBeUpdated.images != null) {
      // prettier-ignore
      dataToBeUpdated.images = dataToBeUpdated.images.map((imgGsPaths: MultiSizePhotoModel) => ({
      small: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.small), "small"),
      medium: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.medium), "medium"),
      large: StoragePaths.RoomPhotos.apiUri(roomId, StoragePaths.RoomPhotos.getImageIdFromGsPath(imgGsPaths.large), "large"),
    }));
    }
    return dataToBeUpdated;
  }
}
