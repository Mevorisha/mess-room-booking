import React from "react";
import useUsrCompositeCtx from "../../hooks/compositeUser.js";
import ButtonText from "../../components/ButtonText";
import ImageLoader from "../../components/ImageLoader/index.jsx";
import useNotification from "../../hooks/notification.js";
import useDialog from "../../hooks/dialogbox.js";
import { loadFileFromFilePicker } from "../../modules/firebase/storage.js";

/**
 * @param {{ largeImageUrl: string }} props
 * @returns {React.JSX.Element}
 */
function DialogContent({ largeImageUrl }) {
  const dialog = useDialog();

  return (
    <div className="pages-Onboarding-PhotoPreview-DialogContent">
      <ImageLoader src={largeImageUrl} alt="profile" />
      <i
        className="btn-close fa fa-close"
        onClick={() => {
          dialog.hide();
        }}
      />
    </div>
  );
}

/**
 * Section where the user can upload their identity documents.
 * @return {React.ReactElement}
 */
export default function SectionIdentiyDocs() {
  const compUsrCtx = useUsrCompositeCtx();
  const notify = useNotification();
  const dialog = useDialog();

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

  /**
   * @param {"WORK_ID" | "GOV_ID"} kind
   */
  function handleShowLargeImage(kind) {
    if (kind === "WORK_ID") {
      if (!compUsrCtx.userCtx.user.identityPhotos?.workId) return;

      dialog.show(
        <DialogContent
          largeImageUrl={compUsrCtx.userCtx.user.identityPhotos.workId.large}
        />,
        "large"
      );
    } else if (kind === "GOV_ID") {
      if (!compUsrCtx.userCtx.user.identityPhotos?.govId) return;

      dialog.show(
        <DialogContent
          largeImageUrl={compUsrCtx.userCtx.user.identityPhotos.govId.large}
        />,
        "large"
      );
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
        .then((file) =>
          compUsrCtx.identityCtx.updateIdentityPhotos({ workId: file })
        )
        .catch((e) => notify(e, "error"));
    } else if (type === "GOV_ID") {
      loadFileFromFilePicker("image/*", maxSizeInBytes)
        .then((file) =>
          compUsrCtx.identityCtx.updateIdentityPhotos({ govId: file })
        )
        .catch((e) => notify(e, "error"));
    }
  }

  /**
   * @param {React.ChangeEvent<HTMLInputElement>} e
   * @param {"WORK_ID" | "GOV_ID"} type
   * @param {"PUBLIC" | "PRIVATE"} value
   */
  function handleVisibilityChange(e, type, value) {
    e.preventDefault();
    switch (type) {
      case "WORK_ID":
        compUsrCtx.identityCtx
          .updateIdentityPhotosVisibility({ workId: value })
          .then(() => notify("Made work ID " + value.toLowerCase(), "success"))
          .catch((e) => notify(e, "error"));
        break;
      case "GOV_ID":
        compUsrCtx.identityCtx
          .updateIdentityPhotosVisibility({ govId: value })
          .then(() => notify("Made gov ID " + value.toLowerCase(), "success"))
          .catch((e) => notify(e, "error"));
        break;
      default:
        break;
    }
  }

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>Upload ID Documents</h1>
        <h4>Documents may be removed or re-uploaded later.</h4>

        <div className="desc">
          <p>
            Documents like work or institution identity card and aadhaar card
            may be used by you room owner to verify your identity.
          </p>
          <p>You can make document visibility public or private.</p>
        </div>

        <div className="uploadid-container">
          {compUsrCtx.userCtx.user.identityPhotos?.workId ? (
            <form
              className="form-container"
              onSubmit={(e) => handleSubmit(e, "WORK_ID")}
            >
              <h4 style={{ margin: 0, width: "100%" }}>Work ID</h4>
              <div className="update-id">
                <ImageLoader
                  alt="Work Identity Document"
                  src={compUsrCtx.userCtx.user.identityPhotos.workId.medium}
                  className="preview-img"
                  onClick={() => handleShowLargeImage("WORK_ID")}
                />
                <div className="id-visibility">
                  <label>
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={
                        compUsrCtx.userCtx.user.identityPhotos.workId
                          .visibilityCode === "PUBLIC"
                      }
                      onChange={(e) =>
                        handleVisibilityChange(e, "WORK_ID", "PUBLIC")
                      }
                    />
                    Public
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={
                        compUsrCtx.userCtx.user.identityPhotos.workId
                          .visibilityCode !== "PUBLIC"
                      }
                      onChange={(e) =>
                        handleVisibilityChange(e, "WORK_ID", "PRIVATE")
                      }
                    />
                    Private
                  </label>
                </div>
                <ButtonText title="Re-Upload" rounded="all" kind="secondary" />
              </div>
            </form>
          ) : (
            <form
              className="form-container"
              onSubmit={(e) => handleSubmit(e, "WORK_ID")}
            >
              <div className="missing-id">
                <div>
                  <h4>Work ID</h4>
                  <p>Eg: Photo ID Card</p>
                </div>
                <ButtonText title="Upload" rounded="all" kind="secondary" />
              </div>
            </form>
          )}
        </div>

        <div className="uploadid-container">
          {compUsrCtx.userCtx.user.identityPhotos?.govId ? (
            <form
              className="form-container"
              onSubmit={(e) => handleSubmit(e, "GOV_ID")}
            >
              <h4 style={{ margin: 0, width: "100%" }}>Government ID</h4>
              <div className="update-id">
                <ImageLoader
                  alt="Government Identity Document"
                  src={compUsrCtx.userCtx.user.identityPhotos.govId.medium}
                  className="preview-img"
                  onClick={() => handleShowLargeImage("GOV_ID")}
                />
                <div className="id-visibility">
                  <label>
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={
                        compUsrCtx.userCtx.user.identityPhotos.govId
                          .visibilityCode === "PUBLIC"
                      }
                      onChange={(e) =>
                        handleVisibilityChange(e, "GOV_ID", "PUBLIC")
                      }
                    />
                    Public
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={
                        compUsrCtx.userCtx.user.identityPhotos.govId
                          .visibilityCode !== "PUBLIC"
                      }
                      onChange={(e) =>
                        handleVisibilityChange(e, "GOV_ID", "PRIVATE")
                      }
                    />
                    Private
                  </label>
                </div>
                <ButtonText title="Re-Upload" rounded="all" kind="secondary" />
              </div>
            </form>
          ) : (
            <form
              className="form-container"
              onSubmit={(e) => handleSubmit(e, "GOV_ID")}
            >
              <div className="missing-id">
                <div>
                  <h4>Government ID</h4>
                  <p>Eg: Aadhaar Card</p>
                </div>
                <ButtonText title="Upload" rounded="all" kind="secondary" />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
