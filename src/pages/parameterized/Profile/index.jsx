import React from "react";

import useCompositeUser from "../../../hooks/compositeUser";
import useDialogBox from "../../../hooks/dialogbox";

import ImageLoader from "../../../components/ImageLoader";
import DialogImagePreview from "../../../components/DialogImagePreview";

import "./styles.css";

// @ts-ignore
import dpGeneric from "../../../assets/images/dpGeneric.png";

/**
 * @returns {React.JSX.Element}
 */
export default function Profile() {
  const compUsr = useCompositeUser();
  const dialog = useDialogBox();

  function handleShowLargeImage() {
    if (!compUsr.userCtx.user.profilePhotos?.large) return;

    dialog.show(
      <DialogImagePreview
        largeImageUrl={compUsr.userCtx.user.profilePhotos?.large}
      />,
      "large"
    );
  }

  const displayName = `${compUsr.userCtx.user.firstName} ${compUsr.userCtx.user.lastName}`;
  const mobileNo = compUsr.userCtx.user.mobile;

  return (
    <div className="pages-Profile">
      <div className="container">
        <h1>
          {compUsr.userCtx.user.type === "OWNER" ? "Owner" : "Tenant"} Profile
        </h1>
        <h4>Profile details will be visible publicly.</h4>

        <div className="photo-container">
          <ImageLoader
            src={compUsr.userCtx.user.profilePhotos?.medium || dpGeneric}
            alt="profile"
            onClick={handleShowLargeImage}
          />
        </div>
        <table className="details-container">
          <tbody>
            <tr className="detail">
              <td className="detail-label">Name: </td>
              <td className="detail-value">{displayName}</td>
            </tr>
            <tr className="detail">
              <td className="detail-label">Mobile: </td>
              <td className="detail-value">{mobileNo}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
