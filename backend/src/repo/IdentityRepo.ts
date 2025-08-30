import { FirestorePaths, StoragePaths } from "@/firebase/init";
import { IdentityModel, IdentityPhotosModel } from "@/models/Identity";
import {
  ApiResponseUrlType,
  AutoSetFields,
  DocType,
  IdentityGetResBodyNoAuthDTO,
  IdentityGetResBodyWithAuthDTO,
  IdentityPhotosDTO,
  IdentityPostReqBodyDTO,
  MultiSizeImageSz,
  MultiSizePhotoDTO,
} from "sharedtypes";
import { FieldValue } from "firebase-admin/firestore";
import { MultiSizePhotoModel } from "@/models/types";
import { CustomApiError } from "@/types/CustomApiError";
import pickObjProps from "@/utils/pickObjProps";
import { DateTransformer } from "@/dataTransformers/DateTransformer";

export class IdentityRepo {
  static async create(uid: string, dto: IdentityPostReqBodyDTO): Promise<void> {
    const ref = FirestorePaths.Identity(uid);
    const createData = pickObjProps(dto, ["email"]);
    await ref.set(
      { ...createData, createdOn: FieldValue.serverTimestamp(), lastModifiedOn: FieldValue.serverTimestamp() },
      /* Required as .create is blindly called everytime user logs in. Without merge true, account
       * data will be overwritten. The reason for blind call is to ensure this doc exists and is synced
       * with info from firebase auth on each login. */
      { merge: true }
    );
  }

  /**
   * Update an existing identity document
   */
  static async update(uid: string, dto: Partial<Omit<IdentityModel, AutoSetFields | "email">>): Promise<void> {
    const docRef = FirestorePaths.Identity(uid);
    const snapshot = await docRef.get();
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
    // convert any DTOs into json
    if (updateData.profilePhotos != null) {
      const photosResult = MultiSizePhotoDTO.create(updateData.profilePhotos);
      if (photosResult.isErr) {
        throw CustomApiError.create(500, "Internal Server Error", photosResult.error);
      }
      updateData.profilePhotos = photosResult.value.toJSON() as MultiSizePhotoDTO;
    }
    // convert any DTOs into json
    if (updateData.identityPhotos != null) {
      const photosResult = IdentityPhotosDTO.create(updateData.identityPhotos);
      if (photosResult.isErr) {
        throw CustomApiError.create(500, "Internal Server Error", photosResult.error);
      }
      updateData.identityPhotos = photosResult.value.toJSON() as IdentityPhotosModel;
    }

    /* Uses set with merge true instead of update as updateData has nested objects */
    await docRef.set({ ...updateData, lastModifiedOn: FieldValue.serverTimestamp() }, { merge: true });
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
