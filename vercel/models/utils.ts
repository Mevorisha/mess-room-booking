import { getStorage } from "firebase-admin/storage";
import { ApiError } from "../lib/utils/ApiError";

export async function imagePathToUrl(data: object, param: string) {
  try {
    if (data[param]) {
      const imgPaths = data[param];
      const imgUrls = {};
      const bucket = getStorage().bucket();
      for (const size of Object.keys(imgPaths)) {
        // if isPrivate field is found and set
        // if (size === "isPrivate" && imgPaths["isPrivate"] === true) {
        //   data[param] = null;
        //   return;
        // } <--- This is to be implemented at API rather than mode
        //        and hence is commented out. This is to ensure the
        //        auth user can access the private image but another
        //        user cannot.
        // Otherwise set all image sizes
        const file = bucket.file(imgPaths[size]);
        imgUrls[size] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + /* 5 min */ 5 * 60 * 1000,
        });
      }
      data[param] = imgUrls;
    }
  } catch (e) {
    return Promise.reject(ApiError.create(500, e.message));
  }
}
