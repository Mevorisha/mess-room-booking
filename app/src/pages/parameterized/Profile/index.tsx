import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import UploadedImage from "@/modules/classes/UploadedImage";
import useNotification from "@/hooks/notification";
import useCompositeUser from "@/hooks/compositeUser";
import useDialogBox from "@/hooks/dialogbox";
import { apiGetOrDelete, ApiPaths } from "@/modules/util/api";
import User from "@/modules/classes/User";
import IdentityNetworkType from "@/modules/networkTypes/Identity";

import ImageLoader from "@/components/ImageLoader";
import DialogImagePreview from "@/components/DialogImagePreview";

import LoadingPage from "@/pages/unparameterized/Loading";
import PageNotFound from "@/pages/unparameterized/PageNotFound";

import "./styles.css";

import dpGeneric from "@/assets/images/dpGeneric.png";

export default function Profile(): React.ReactNode {
  const compUsr = useCompositeUser();
  const dialog = useDialogBox();
  const notify = useNotification();
  const [searchParams] = useSearchParams();

  // null userProfile means profile not found
  const [userProfile, setProfileUser] = useState<User | null>(compUsr.userCtx.user);

  useEffect(() => {
    // no ID is ok
    if (!searchParams.has("id")) return;
    // empty ID is not ok
    if (searchParams.get("id") == null) {
      setProfileUser(null);
      return;
    }

    const uid = searchParams.get("id") as string;

    apiGetOrDelete("GET", ApiPaths.Profile.read(uid))
      .then(({ json }) => {
        const data = json as IdentityNetworkType;
        let { firstName = "", lastName = "", profilePhotos } = data;
        const { mobile = "" } = data;
        // If no mobile no., the user is considered to not exist
        if (firstName.length === 0 && lastName.length === 0) {
          firstName = "(No Name)";
          lastName = "";
        }
        profilePhotos = profilePhotos ?? {
          small: dpGeneric,
          medium: dpGeneric,
          large: dpGeneric,
        };
        setProfileUser((oldProfile) => {
          if (oldProfile == null) return null;
          const newProfile = oldProfile.clone();
          newProfile.uid = uid;
          newProfile.setProfileName(firstName, lastName);
          newProfile.setMobile(mobile);
          newProfile.setProfilePhotos(UploadedImage.from(uid, profilePhotos, false));
          return newProfile;
        });
      })
      .catch((e: Error) => {
        setProfileUser(null);
        notify(e, "error");
      });
  }, [notify, searchParams]);

  // user profile set to null by useEffect means profile not found
  if (userProfile == null) {
    return <PageNotFound />;
  }

  // id present and current user is not same as user id in query means queried profile still not loaded
  if (searchParams.has("id") && userProfile.uid !== searchParams.get("id")) {
    return <LoadingPage />;
  }

  function handleShowLargeImage() {
    if (userProfile == null) return;
    if (userProfile.profilePhotos?.large == null) return;
    dialog.show(<DialogImagePreview largeImageUrl={userProfile.profilePhotos.large} />, "large");
  }

  const displayName =
    userProfile.firstName.length === 0 || userProfile.lastName.length === 0
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
            src={userProfile.profilePhotos?.medium ?? dpGeneric}
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
              <td className="detail-value">{userProfile.mobile.length > 0 ? userProfile.mobile : "(Unavailable)"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
