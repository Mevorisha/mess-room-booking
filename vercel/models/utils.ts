import { getStorage } from "firebase-admin/storage";
import { ApiError } from "../lib/utils/ApiError";

export async function imagePathToUrl(data: object, param: string) {
  try {
    if (data[param]) {
      const imgPaths = data[param];
      const imgUrls = {};
      const bucket = getStorage().bucket();
      for (const size of Object.keys(imgPaths)) {
        const file = bucket.file(imgPaths[size]);
        imgUrls[size] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + /* 30 min */ 30 * 60 * 1000,
        });
      }
      data[param] = imgUrls;
    }
  } catch (e) {
    return Promise.reject(ApiError.create(500, e.message));
  }
}
