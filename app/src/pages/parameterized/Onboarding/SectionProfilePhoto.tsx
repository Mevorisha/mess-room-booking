import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loadFileFromFilePicker } from "@/modules/util/dom.js";
import { PageType } from "@/modules/util/pageUrls.js";

import useCompositeUser from "@/hooks/compositeUser.js";
import useNotification from "@/hooks/notification.js";
import useDialog from "@/hooks/dialogbox.js";

import ButtonText from "@/components/ButtonText";
import ImageLoader from "@/components/ImageLoader";
import DialogImagePreview from "@/components/DialogImagePreview";

import dpGeneric from "@/assets/images/dpGeneric.png";

export default function SetProfilePhoto(): React.ReactNode {
  const compUsr = useCompositeUser();
  const notify = useNotification();
  const dialog = useDialog();
  const navigate = useNavigate();

  // state
  const [photoURL, setPhotoURL] = useState(compUsr.userCtx.user.profilePhotos?.medium ?? dpGeneric);

  const [buttonKind, setButtonKind] = useState<"primary" | "loading">("primary");

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

  function handleUpdatePhoto() {
    Promise.resolve()
      .then(() => loadFileFromFilePicker("image/*", maxSizeInBytes))
      .then((file) => {
        setButtonKind("loading");
        return file;
      })
      .then((file) => compUsr.profileCtx.updateProfilePhoto(file))
      .then((url) => {
        setButtonKind("primary");
        return url;
      })
      .then((url) => setPhotoURL(url))
      .then(() => navigate(PageType.HOME))
      .catch((e: Error) => {
        setButtonKind("primary");
        notify(e, "error");
      });
  }

  function handleShowLargeImage() {
    if (compUsr.userCtx.user.profilePhotos?.large == null) return;

    dialog.show(<DialogImagePreview largeImageUrl={compUsr.userCtx.user.profilePhotos.large} />, "large");
  }

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>Set Profile Photo</h1>
        <h4>Photo can be changed later</h4>

        <div className="desc">
          <p>
            Photo is required for identification and allows your room{" "}
            {compUsr.userCtx.user.type === "TENANT" ? "owner" : "tenant"} to recognize you.
          </p>
        </div>

        <div className="photo-container">
          <ImageLoader src={photoURL} alt="profile" onClick={handleShowLargeImage} />
          <ButtonText rounded="all" title="Update Photo" kind={buttonKind} width="50%" onClick={handleUpdatePhoto} />
        </div>
      </div>
    </div>
  );
}
