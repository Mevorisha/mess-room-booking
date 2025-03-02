import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { UploadedImage } from "../../../contexts/user";
import useNotification from "../../../hooks/notification";
import useCompositeUser from "../../../hooks/compositeUser";
import useDialogBox from "../../../hooks/dialogbox";

import ImageLoader from "../../../components/ImageLoader";
import DialogImagePreview from "../../../components/DialogImagePreview";

import LoadingPage from "../../unparameterized/Loading";
import PageNotFound from "../../unparameterized/PageNotFound";

import "./styles.css";

// @ts-ignore
import dpGeneric from "../../../assets/images/dpGeneric.png";
import { apiGetOrDelete, ApiPaths } from "../../../modules/util/api";

/**
 * @returns {React.JSX.Element}
 */
export default function Profile() {
  const compUsr = useCompositeUser();
  const dialog = useDialogBox();
  const notify = useNotification();
  const [searchParams] = useSearchParams();

  // null userProfile means profile not found
  let [userProfile, setProfileUser] = useState(
    /** @type {import("../../../contexts/user").User | null} */ (compUsr.userCtx.user)
  );

  useEffect(() => {
    // no ID is ok
    if (!searchParams.has("id")) return;
    // empty ID is not ok
    if (!searchParams.get("id")) {
      setProfileUser(null);
      return;
    }

    const uid = /** @type {string} */ (searchParams.get("id"));

    apiGetOrDelete("GET", ApiPaths.Profile.read(uid))
      .then(({ json: { firstName, lastName, mobile, profilePhotos } }) => {
        if (!mobile) {
          setProfileUser(null);
          return;
        }
        firstName ||= "";
        lastName ||= "";
        if (!firstName && !lastName) {
          firstName = "(No Name)";
          lastName = "";
        }
        profilePhotos ||= {
          small: dpGeneric,
          medium: dpGeneric,
          large: dpGeneric,
        };
        setProfileUser((oldProfile) => {
          if (!oldProfile) return null;
          const newProfile = oldProfile.clone();
          newProfile.uid = uid;
          newProfile.setProfileName(firstName, lastName);
          newProfile.setMobile(mobile);
          newProfile.setProfilePhotos(UploadedImage.from(uid, profilePhotos));
          return newProfile;
        });
      })
      .catch((e) => {
        setProfileUser(null);
        notify(e, "error");
      });
  }, [notify, searchParams]);

  // user profile set to null by useEffect means profile not found
  if (!userProfile) {
    return <PageNotFound />;
  }

  // id present and current user is not same as user id in query means queried profile still not loaded
  if (searchParams.has("id") && userProfile.uid !== searchParams.get("id")) {
    return <LoadingPage />;
  }

  function handleShowLargeImage() {
    if (!userProfile) return;

    if (!userProfile.profilePhotos?.large) return;

    dialog.show(<DialogImagePreview largeImageUrl={userProfile.profilePhotos?.large} />, "large");
  }

  const displayName =
    !userProfile.firstName && !userProfile.lastName
      ? "(Not Provided)"
      : `${userProfile.firstName} ${userProfile.lastName}`;

  return (
    <div className="pages-Profile">
      <div className="container">
        <h1>
          {compUsr.userCtx.user.uid === userProfile.uid
            ? userProfile.type === "OWNER"
              ? "Owner"
              : "Tenant"
            : "User's"}{" "}
          Profile
        </h1>
        <h4>Profile details will be visible publicly.</h4>

        <div className="photo-container">
          <ImageLoader
            src={userProfile.profilePhotos?.medium || dpGeneric}
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
              <td className="detail-value">{userProfile.mobile}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
