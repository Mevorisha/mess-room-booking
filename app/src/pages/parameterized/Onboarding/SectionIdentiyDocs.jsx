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
 * Renders the section for uploading and managing identity documents.
 *
 * This component provides an interface for users to upload, update, and manage
 * their identity documents (e.g., Work ID and Government ID), including adjusting
 * document visibility settings. It leverages custom hooks to integrate user context,
 * notifications, and dialog management.
 *
 * @returns {React.JSX.Element} The rendered identity document management section.
 */

/**
 * Opens a dialog to display a larger preview of the selected identity document.
 *
 * Checks whether the chosen document image exists for the specified type ("WORK_ID" or "GOV_ID")
 * and, if available, displays it in a dialog with an enlarged view.
 *
 * @param {"WORK_ID" | "GOV_ID"} kind - The type of identity document to preview.
 */

/**
 * Handles the submission event for uploading or updating an identity document.
 *
 * Prevents the default form action, invokes a file picker to select an image (up to 5MB),
 * and updates the corresponding identity document (Work ID or Government ID) in the user context.
 * Upon success, it refreshes the image display by incrementing the reload counter;
 * errors are caught and displayed via notifications.
 *
 * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
 * @param {"WORK_ID" | "GOV_ID"} type - The type of identity document being updated.
 */

/**
 * Updates the visibility setting for a specified identity document.
 *
 * Prevents the default event behavior and updates the visibility (public or private)
 * for the selected identity document. On successful update, it displays a localized
 * success notification and refreshes the image display; any errors encountered are notified.
 *
 * @param {React.ChangeEvent<HTMLInputElement>} e - The change event for the visibility input.
 * @param {"WORK_ID" | "GOV_ID"} type - The type of identity document whose visibility is being updated.
 * @param {"PUBLIC" | "PRIVATE"} value - The new visibility state for the document.
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
   * Updates the visibility setting for a user's identity document.
   *
   * Prevents the default event behavior and updates the document's visibility (either "PUBLIC" or "PRIVATE")
   * based on the specified document type ("WORK_ID" or "GOV_ID"). Upon a successful update, it displays
   * a localized success notification and triggers a UI refresh of the corresponding image. Errors during
   * the update process are handled by displaying an error notification.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event that triggers the visibility update.
   * @param {"WORK_ID" | "GOV_ID"} type - The type of identity document to update.
   * @param {"PUBLIC" | "PRIVATE"} value - The new visibility setting for the document.
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
