import { FirestorePaths, StoragePaths } from "@/firebase/init";
import { IdentityModel, IdentityPhotosModel } from "@/models/Identity";
import {
  ApiResponseUrlType,
  AutoSetFields,
  IdentityGetResBodyNoAuthDTO,
  IdentityGetResBodyWithAuthDTO,
  IdentityPostReqBodyDTO,
} from "sharedtypes";
import { FieldValue } from "firebase-admin/firestore";
import { MultiSizePhoto } from "@/models/types";
import { CustomApiError } from "@/types/CustomApiError";

export class IdentityRepo {
  static async create(uid: string, dto: IdentityPostReqBodyDTO): Promise<void> {
    const ref = FirestorePaths.Identity(uid);
    await ref.set(
      { ...dto, createdOn: FieldValue.serverTimestamp(), lastModifiedOn: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  /**
   * Update an existing identity document
   */
  static async update(uid: string, updateData: Partial<Omit<IdentityModel, AutoSetFields>>): Promise<void> {
    const ref = FirestorePaths.Identity(uid);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return Promise.reject(CustomApiError.create(404, "User not found"));
    }
    await ref.set({ ...updateData, lastModifiedOn: FieldValue.serverTimestamp() }, { merge: true });
  }

  static async findById(
    uid: string,
    extUrls: ApiResponseUrlType,
    options?: { auth?: false }
  ): Promise<IdentityGetResBodyNoAuthDTO | null>;
  static async findById(
    uid: string,
    extUrls: ApiResponseUrlType,
    options: { auth: true }
  ): Promise<IdentityGetResBodyWithAuthDTO | null>;

  static async findById(
    uid: string,
    extUrls: ApiResponseUrlType,
    options?: { auth?: boolean }
  ): Promise<IdentityModel | IdentityGetResBodyNoAuthDTO | IdentityGetResBodyWithAuthDTO | null> {
    const ref = FirestorePaths.Identity(uid);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return null;
    }
    let data = snapshot.data() as IdentityModel | null;
    if (data == null) {
      return null;
    }

    if (extUrls === "API_URI") {
      data = imgConvertGsPathToApiUri(data, uid);
    }

    if (options?.auth == null || options.auth === false) {
      const jsonResult = IdentityGetResBodyNoAuthDTO.fromJson(data);
      if (jsonResult.isErr) {
        throw CustomApiError.create(500, "Validation failure", jsonResult.error);
      }
      return jsonResult.value;
    } else {
      const jsonResult = IdentityGetResBodyWithAuthDTO.fromJson(data);
      if (jsonResult.isErr) {
        throw CustomApiError.create(500, "Validation failure", jsonResult.error);
      }
      return jsonResult.value;
    }
  }
}

function imgConvertGsPathToApiUri<T extends { profilePhotos?: MultiSizePhoto; identityPhotos?: IdentityPhotosModel }>(
  dataToUpdate: T,
  uid: string
) {
  // convert image paths in profile photos to URLs
  if (dataToUpdate.profilePhotos != null) {
    dataToUpdate.profilePhotos = {
      small: StoragePaths.ProfilePhotos.apiUri(uid, "small"),
      medium: StoragePaths.ProfilePhotos.apiUri(uid, "medium"),
      large: StoragePaths.ProfilePhotos.apiUri(uid, "large"),
    };
  }
  if (dataToUpdate.identityPhotos != null) {
    const workId = {
      small: StoragePaths.IdentityDocuments.apiUri(uid, "WORK_ID", "small"),
      medium: StoragePaths.IdentityDocuments.apiUri(uid, "WORK_ID", "medium"),
      large: StoragePaths.IdentityDocuments.apiUri(uid, "WORK_ID", "large"),
    };
    const govId = {
      small: StoragePaths.IdentityDocuments.apiUri(uid, "GOV_ID", "small"),
      medium: StoragePaths.IdentityDocuments.apiUri(uid, "GOV_ID", "medium"),
      large: StoragePaths.IdentityDocuments.apiUri(uid, "GOV_ID", "large"),
    };
    const ids: { workId?: MultiSizePhoto; govId?: MultiSizePhoto } = {};
    if (dataToUpdate.identityPhotos.workId != null) ids.workId = workId;
    if (dataToUpdate.identityPhotos.govId != null) ids.govId = govId;
    dataToUpdate.identityPhotos = {
      ...ids,
      workIdIsPrivate: dataToUpdate.identityPhotos.workIdIsPrivate ?? true,
      govIdIsPrivate: dataToUpdate.identityPhotos.govIdIsPrivate ?? true,
    };
  }
  return dataToUpdate;
}
