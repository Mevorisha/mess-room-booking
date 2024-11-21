import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadFileFromFilePicker } from "../../modules/firebase/storage.js";
import { PageUrls } from "../../modules/util/pageUrls.js";
import useAuth from "../../hooks/auth.js";
import useNotification from "../../hooks/notification.js";
import useDialog from "../../hooks/dialogbox.js";
import ButtonText from "../../components/ButtonText";

// @ts-ignore
import dpGeneric from "../../assets/images/dpGeneric.png";

/**
 * @param {{ largeImageUrl: string }} props
 * @returns {React.JSX.Element}
 */
function DialogContent({ largeImageUrl }) {
  const dialog = useDialog();

  return (
    <div className="pages-Onboarding-ProfilePhoto-DialogContent">
      <img src={largeImageUrl} alt="profile" />
      <i
        className="btn-close fa fa-close"
        onClick={() => {
          dialog.hide();
        }}
      />
    </div>
  );
}

export default function SetProfilePhoto() {
  const auth = useAuth();
  const notify = useNotification();
  const dialog = useDialog();
  const navigate = useNavigate();

  // state
  const [photoURL, setPhotoURL] = useState(
    auth.user.profilePhotos?.medium || dpGeneric
  );

  const [buttonKind, setButtonKind] = useState(
    /** @type {"primary" | "loading"} */ ("primary")
  );

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

  function handleUpdatePhoto() {
    Promise.resolve()
      .then(() => loadFileFromFilePicker("image/*", maxSizeInBytes))
      .then((file) => {
        setButtonKind("loading");
        return file;
      })
      .then((file) => auth.updateProfilePhoto(file))
      .then((url) => {
        setButtonKind("primary");
        return url;
      })
      .then((url) => setPhotoURL(url))
      .then(() => navigate(PageUrls.HOME))
      .catch((e) => {
        setButtonKind("primary");
        notify(e, "error");
      });
  }

  function handleShowLargeImage() {
    if (!auth.user.profilePhotos?.large) return;

    dialog.show(
      <DialogContent largeImageUrl={auth.user.profilePhotos?.large} />,
      "large"
    );
  }

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>Set Profile Photo</h1>
        <h4>Photo can be changed later</h4>

        <div className="desc">
          <p>
            Photo is required for identification and allows your room{" "}
            {auth.user.type === "TENANT" ? "owner" : "tenant"} to recognize you.
          </p>
        </div>

        <div className="photo-container">
          <img src={photoURL} alt="profile" onClick={handleShowLargeImage} />
          <ButtonText
            rounded="all"
            title="Update Photo"
            kind={buttonKind}
            width="50%"
            onClick={handleUpdatePhoto}
          />
        </div>
      </div>
    </div>
  );
}
