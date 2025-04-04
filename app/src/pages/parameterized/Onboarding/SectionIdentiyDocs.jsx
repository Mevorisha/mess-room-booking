import React, { useState } from "react";

import { loadFileFromFilePicker } from "@/modules/util/dom.js";
import useNotification from "@/hooks/notification.js";
import useCompositeUser from "@/hooks/compositeUser.js";
import useDialog from "@/hooks/dialogbox.js";

import ButtonText from "@/components/ButtonText";
import ImageLoader from "@/components/ImageLoader";
import DialogImagePreview from "@/components/DialogImagePreview";
import { lang } from "@/modules/util/language.js";

/**
 * Renders an interface for uploading and managing identity documents.
 *
 * This component enables users to upload or update their Work ID and Government ID images.
 * It supports localized labels, image preview dialogs, and toggling between public and private
 * visibility settings. Notifications are shown for successful operations or error events,
 * and image reloads are triggered to reflect updates.
 *
 * @returns {React.JSX.Element} The rendered identity document upload section.
 */
export default function SectionIdentiyDocs() {
  const [forceWorkImgReload, setForceWorkImgReload] = useState(0);
  const [forceGovImgReload, setForceGovImgReload] = useState(0);

  const compUsr = useCompositeUser();
  const notify = useNotification();
  const dialog = useDialog();

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

  /**
   * @param {"WORK_ID" | "GOV_ID"} kind
   */
  function handleShowLargeImage(kind) {
    if (kind === "WORK_ID") {
      if (!compUsr.userCtx.user.identityPhotos?.workId) return;

      dialog.show(<DialogImagePreview largeImageUrl={compUsr.userCtx.user.identityPhotos.workId.large} />, "large");
    } else if (kind === "GOV_ID") {
      if (!compUsr.userCtx.user.identityPhotos?.govId) return;

      dialog.show(<DialogImagePreview largeImageUrl={compUsr.userCtx.user.identityPhotos.govId.large} />, "large");
    }
  }

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   * @param {"WORK_ID" | "GOV_ID"} type
   */
  function handleSubmit(e, type) {
    e.preventDefault();
    if (type === "WORK_ID") {
      loadFileFromFilePicker("image/*", maxSizeInBytes)
        .then((file) => compUsr.identityCtx.updateIdentityPhotos({ workId: file }))
        .then(() => setForceWorkImgReload((old) => old + 1))
        .catch((e) => notify(e, "error"));
    } else if (type === "GOV_ID") {
      loadFileFromFilePicker("image/*", maxSizeInBytes)
        .then((file) => compUsr.identityCtx.updateIdentityPhotos({ govId: file }))
        .then(() => setForceGovImgReload((old) => old + 1))
        .catch((e) => notify(e, "error"));
    }
  }

  /**
   * Updates the visibility of a specified identity document and refreshes the corresponding image.
   *
   * This function prevents the default event behavior and uses the user's identity context to update
   * the visibility of either the Work ID or Government ID. On success, it displays a localized notification
   * indicating the new visibility status and triggers a re-render of the affected image. If the update fails,
   * an error notification is displayed.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The event triggered by the input change.
   * @param {"WORK_ID" | "GOV_ID"} type - The type of identity document to update.
   * @param {"PUBLIC" | "PRIVATE"} value - The new visibility setting for the identity document.
   */
  function handleVisibilityChange(e, type, value) {
    e.preventDefault();
    switch (type) {
      case "WORK_ID":
        compUsr.identityCtx
          .updateIdentityPhotosVisibility({ workId: value })
          .then(() =>
            notify(
              lang(
                `Made work ID '${value.toLocaleUpperCase()}'`,
                `কাজ আইডি '${value.toLocaleUpperCase()}' করা হয়েছে`,
                `कार्य आईडी '${value.toLocaleUpperCase()}' बनाई गई है`
              ),
              "success"
            )
          )
          .then(() => setForceWorkImgReload((old) => old + 1))
          .catch((e) => notify(e, "error"));
        break;
      case "GOV_ID":
        compUsr.identityCtx
          .updateIdentityPhotosVisibility({ govId: value })
          .then(() =>
            notify(
              lang(
                `Made gov ID '${value.toLowerCase()}'`,
                `গভর্নমেন্ট আইডি '${value.toLowerCase()}' করা হয়েছে`,
                `सरकारी आईडी '${value.toLowerCase()}' बनाई गई है`
              ),
              "success"
            )
          )
          .then(() => setForceGovImgReload((old) => old + 1))
          .catch((e) => notify(e, "error"));
        break;
      default:
        break;
    }
  }

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>{lang("Upload ID Documents", "আইডি ডকুমেন্ট আপলোড করুন", "आईडी दस्तावेज़ अपलोड करें")}</h1>
        <h4>
          {lang(
            "Documents may be removed or re-uploaded later.",
            "ডকুমেন্টগুলি পরবর্তীতে মুছে ফেলা বা আবার আপলোড করা যেতে পারে।",
            "दस्तावेज़ बाद में हटाए जा सकते हैं या फिर से अपलोड किए जा सकते हैं।"
          )}
        </h4>

        <div className="desc">
          <p>
            {lang(
              "Documents like work or institution identity card and aadhaar card may be used by your room owner to verify your identity.",
              "কর্ম বা প্রতিষ্ঠান পরিচয়পত্র এবং আধার কার্ডের মতো ডকুমেন্টগুলি আপনার রুম মালিক আপনার পরিচয় যাচাই করতে ব্যবহার করতে পারেন।",
              "काम या संस्थान पहचान पत्र और आधार कार्ड जैसे दस्तावेज़ आपके कमरे के मालिक द्वारा आपकी पहचान सत्यापित करने के लिए उपयोग किए जा सकते हैं।"
            )}
          </p>
          <p>
            {lang(
              "You can make document visibility public or private.",
              "আপনি ডকুমেন্টের দৃশ্যমানতা পাবলিক বা প্রাইভেট করতে পারেন।",
              "आप दस्तावेज़ की दृश्यता सार्वजनिक या निजी बना सकते हैं।"
            )}
          </p>
        </div>

        <div className="uploadid-container">
          {compUsr.userCtx.user.identityPhotos?.workId ? (
            <form className="form-container" onSubmit={(e) => handleSubmit(e, "WORK_ID")}>
              <h4 style={{ margin: 0, width: "100%" }}>Work ID</h4>
              <div className="update-id">
                <ImageLoader
                  requireAuth
                  forceReloadState={forceWorkImgReload}
                  alt={lang("Work ID", "কাজের আইডি", "काम के लिए आईडी")}
                  src={compUsr.userCtx.user.identityPhotos.workId.medium}
                  className="preview-img"
                  onClick={() => handleShowLargeImage("WORK_ID")}
                />
                <div className="id-visibility">
                  <label>
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={!compUsr.userCtx.user.identityPhotos.workId.isPrivate}
                      onChange={(e) => handleVisibilityChange(e, "WORK_ID", "PUBLIC")}
                    />
                    {lang("Public", "পাবলিক", "पब्लिक")}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={compUsr.userCtx.user.identityPhotos.workId.isPrivate}
                      onChange={(e) => handleVisibilityChange(e, "WORK_ID", "PRIVATE")}
                    />
                    {lang("Private", "প্রাইভেট", "प्राइवेट")}
                  </label>
                </div>
                <ButtonText title={lang("Update", "আপডেট", "अपडेट")} rounded="all" kind="secondary" />
              </div>
            </form>
          ) : (
            <form className="form-container" onSubmit={(e) => handleSubmit(e, "WORK_ID")}>
              <div className="missing-id">
                <div>
                  <h4>{lang("Work ID", "কাজের আইডি", "काम के लिए आईडी")}</h4>
                  <p>{lang("Eg: Photo ID Card", "যেমন: ছবিযুক্ত আইডি কার্ড", "उदाहरण: फोटो आईडी कार्ड")}</p>
                </div>
                <ButtonText title={lang("Upload", "আপলোড", "अपलोड")} rounded="all" kind="secondary" />
              </div>
            </form>
          )}
        </div>

        <div className="uploadid-container">
          {compUsr.userCtx.user.identityPhotos?.govId ? (
            <form className="form-container" onSubmit={(e) => handleSubmit(e, "GOV_ID")}>
              <h4 style={{ margin: 0, width: "100%" }}>Government ID</h4>
              <div className="update-id">
                <ImageLoader
                  requireAuth
                  forceReloadState={forceGovImgReload}
                  alt={lang("Government ID", "সরকারি আইডি", "सरकारी आईडी")}
                  src={compUsr.userCtx.user.identityPhotos.govId.medium}
                  className="preview-img"
                  onClick={() => handleShowLargeImage("GOV_ID")}
                />
                <div className="id-visibility">
                  <label>
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={!compUsr.userCtx.user.identityPhotos.govId.isPrivate}
                      onChange={(e) => handleVisibilityChange(e, "GOV_ID", "PUBLIC")}
                    />
                    {lang("Public", "পাবলিক", "पब्लिक")}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={compUsr.userCtx.user.identityPhotos.govId.isPrivate}
                      onChange={(e) => handleVisibilityChange(e, "GOV_ID", "PRIVATE")}
                    />
                    {lang("Private", "প্রাইভেট", "प्राइवेट")}
                  </label>
                </div>
                <ButtonText title={lang("Update", "আপডেট", "अपडेट")} rounded="all" kind="secondary" />
              </div>
            </form>
          ) : (
            <form className="form-container" onSubmit={(e) => handleSubmit(e, "GOV_ID")}>
              <div className="missing-id">
                <div>
                  <h4>{lang("Government ID", "সরকারি আইডি", "सरकारी आईडी")}</h4>
                  <p>{lang("Eg: Aadhaar Card", "যেমন: আধার কার্ড", "उदाहरण: आधार कार्ड")}</p>
                </div>
                <ButtonText title={lang("Upload", "আপলোড", "अपलोड")} rounded="all" kind="secondary" />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
