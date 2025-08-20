import { FirestorePaths, StoragePaths } from "@/firebase/init";
import { IdentityModel, IdentityPhotosModel } from "@/models/Identity";
import {
  ApiResponseUrlType,
  AutoSetFields,
  DocType,
  IdentityGetResBodyNoAuthDTO,
  IdentityGetResBodyWithAuthDTO,
  IdentityPostReqBodyDTO,
  MultiSizeImageSz,
} from "sharedtypes";
import { FieldValue } from "firebase-admin/firestore";
import { MultiSizePhotoModel } from "@/models/types";
import { CustomApiError } from "@/types/CustomApiError";
import pickObjProps from "@/utils/pickObjProps";
import { DateTransformer } from "@/dataTransformers/DateTransformer";

export class IdentityRepo {
  static async create(uid: string, dto: IdentityPostReqBodyDTO): Promise<void> {
    const ref = FirestorePaths.Identity(uid);
    const createData = pickObjProps(dto, ["email", "type"]);
    await ref.set(
      { ...createData, createdOn: FieldValue.serverTimestamp(), lastModifiedOn: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  /**
   * Update an existing identity document
   */
  static async update(uid: string, dto: Partial<Omit<IdentityModel, AutoSetFields | "email">>): Promise<void> {
    const ref = FirestorePaths.Identity(uid);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return Promise.reject(CustomApiError.create(404, "User not found"));
    }
    const updateData = pickObjProps(dto, [
      "type",
      "firstName",
      "lastName",
      "mobile",
      "language",
      "profilePhotos",
      "identityPhotos",
    ]);
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

    if (extUrls === ApiResponseUrlType.API_URI) {
      data = imgConvertGsPathToApiUri(data, uid);
    }

    const dateTransformed = DateTransformer.transform(data);

    if (options?.auth == null || options.auth === false) {
      const jsonResult = IdentityGetResBodyNoAuthDTO.fromJson(dateTransformed);
      if (jsonResult.isErr) {
        throw CustomApiError.create(500, "Internal Server Error", jsonResult.error);
      }
      return jsonResult.value;
    } else {
      const jsonResult = IdentityGetResBodyWithAuthDTO.fromJson(dateTransformed);
      if (jsonResult.isErr) {
        throw CustomApiError.create(500, "Internal Server Error", jsonResult.error);
      }
      return jsonResult.value;
    }
  }
}

function imgConvertGsPathToApiUri<
  T extends { profilePhotos?: MultiSizePhotoModel; identityPhotos?: IdentityPhotosModel }
>(dataToUpdate: T, uid: string) {
  // convert image paths in profile photos to URLs
  if (dataToUpdate.profilePhotos != null) {
    dataToUpdate.profilePhotos = {
      small: StoragePaths.ProfilePhotos.apiUri(uid, MultiSizeImageSz.SMALL),
      medium: StoragePaths.ProfilePhotos.apiUri(uid, MultiSizeImageSz.MEDIUM),
      large: StoragePaths.ProfilePhotos.apiUri(uid, MultiSizeImageSz.LARGE),
    };
  }
  if (dataToUpdate.identityPhotos != null) {
    const workId = {
      small: StoragePaths.IdentityDocuments.apiUri(uid, DocType.WORK_ID, MultiSizeImageSz.SMALL),
      medium: StoragePaths.IdentityDocuments.apiUri(uid, DocType.WORK_ID, MultiSizeImageSz.MEDIUM),
      large: StoragePaths.IdentityDocuments.apiUri(uid, DocType.WORK_ID, MultiSizeImageSz.LARGE),
    };
    const govId = {
      small: StoragePaths.IdentityDocuments.apiUri(uid, DocType.GOV_ID, MultiSizeImageSz.SMALL),
      medium: StoragePaths.IdentityDocuments.apiUri(uid, DocType.GOV_ID, MultiSizeImageSz.MEDIUM),
      large: StoragePaths.IdentityDocuments.apiUri(uid, DocType.GOV_ID, MultiSizeImageSz.LARGE),
    };
    const ids: { workId?: MultiSizePhotoModel; govId?: MultiSizePhotoModel } = {};
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
