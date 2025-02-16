import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { fbRtdbRead } from "../../../modules/firebase/db";
import { RtDbPaths } from "../../../modules/firebase/init";
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
    /** @type {import("../../../contexts/user").User | null} */ (
      compUsr.userCtx.user
    )
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
    const displayName = fbRtdbRead(RtDbPaths.Identity(uid) + "/displayName");
    const mobileNo = fbRtdbRead(RtDbPaths.Identity(uid) + "/mobile");
    // prettier-ignore
    const profilePhotos = fbRtdbRead(RtDbPaths.Identity(uid) + "/profilePhotos");

    Promise.all([displayName, mobileNo, profilePhotos])
      .then((values) => {
        if (!values[0] || !values[1] || !values[2]) {
          setProfileUser(null);
          return;
        }
        setProfileUser((oldProfile) => {
          if (!oldProfile) return null;
          const newProfile = oldProfile.clone();
          newProfile.uid = uid;
          newProfile.setProfileName(
            values[0].split(" ")[0],
            values[0].split(" ")[1]
          );
          newProfile.setMobile(values[1]);
          newProfile.setProfilePhotos(UploadedImage.from(uid, values[2]));
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

    dialog.show(
      <DialogImagePreview largeImageUrl={userProfile.profilePhotos?.large} />,
      "large"
    );
  }

  const displayName = `${userProfile.firstName} ${userProfile.lastName}`;
  const mobileNo = userProfile.mobile;

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
              <td className="detail-value">{mobileNo}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
