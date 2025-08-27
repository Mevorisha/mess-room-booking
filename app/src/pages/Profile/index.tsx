import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { HttpMethodTypes, IdentityGetResBodyNoAuthDTO, IdentityType, MultiSizePhotoDTO, Nullable, UNKNOWN_STR } from "sharedtypes";
import useNotification from "@/hooks/notification";
import useCompositeUser from "@/hooks/compositeUser";
import useDialog from "@/hooks/dialogbox";
import { apiGetOrDelete, ApiPaths } from "@/modules/util/api";

import ImageLoader from "@/components/ImageLoader";
import DialogImagePreview from "@/components/DialogImagePreview";

import LoadingPage from "@/pages/Loading";
import PageNotFound from "@/pages/PageNotFound";

import "./styles.css";

import dpGeneric from "@/assets/images/dpGeneric.png";

export default function Profile(): React.ReactNode {
  const compUsr = useCompositeUser();
  const dialog = useDialog();
  const notify = useNotification();
  const [searchParams] = useSearchParams();

  // null userProfile means profile not found
  const [userUid, setUserUid] = useState<Nullable<string>>(compUsr.userCtx.user.uid);
  const [profileDTO, setProfileDTO] = useState<Nullable<IdentityGetResBodyNoAuthDTO>>(compUsr.userCtx.user.get("identity")); // prettier-ignore

  useEffect(() => {
    // no ID is ok -> load self user (logged in user)
    if (!searchParams.has("id")) return;
    // empty ID is not ok -> null renders loading page conditionally (see below)
    if (searchParams.get("id") == null) {
      setProfileDTO(null);
      return;
    }

    const uid = searchParams.get("id") ?? userUid ?? UNKNOWN_STR;

    apiGetOrDelete(HttpMethodTypes.GET, ApiPaths.Profile.read(uid), IdentityGetResBodyNoAuthDTO)
      .then(({ dto }) => {
        // If no mobile no., the user is considered to not exist
        if ((dto.firstName == null && dto.lastName == null) || (dto.firstName === "" && dto.lastName === "")) {
          dto.firstName = "(Not";
          dto.lastName = "Provided)";
        } else {
          dto.firstName = dto.firstName ?? "";
          dto.lastName = dto.lastName ?? "";
        }
        if (dto.mobile == null || dto.mobile === "") {
          dto.mobile = "(Unavailable)";
        }
        dto.profilePhotos =
          dto.profilePhotos ??
          MultiSizePhotoDTO.create({
            small: dpGeneric,
            medium: dpGeneric,
            large: dpGeneric,
          });
        setUserUid(uid);
        setProfileDTO(dto);
      })
      .catch((e: Error) => {
        setProfileDTO(null);
        notify(e, "error");
      });
  }, [notify, searchParams, userUid]);

  // user profile set to null by useEffect means profile not found
  if (profileDTO == null) {
    return <PageNotFound />;
  }

  // id present and current user is not same as user id in query means queried profile still not loaded
  if (searchParams.has("id") && userUid !== searchParams.get("id")) {
    return <LoadingPage />;
  }

  function handleShowLargeImage() {
    if (profileDTO?.profilePhotos == null) return;
    dialog.show(<DialogImagePreview largeImageUrl={profileDTO.profilePhotos.large} />, "large");
  }

  const firstName = profileDTO.firstName;
  const lastName = profileDTO.lastName;
  const displayName = firstName == null && lastName == null ? "(Not Provided)" : `${firstName ?? ""} ${lastName ?? ""}`;

  let whoseProfile = "User's Profile";
  if (compUsr.userCtx.user.uid === userUid) {
    switch (compUsr.userCtx.user.get("type")) {
      case IdentityType.OWNER:
        whoseProfile = "Your Owner Profile";
        break;
      case IdentityType.TENANT:
        whoseProfile = "Your Tenant Profile";
        break;
      case void 0:
      case null:
        whoseProfile = "User's Profile";
        break;
    }
  }

  return (
    <div className="pages-Profile">
      <div className="container">
        <h1>{whoseProfile}</h1>
        <h4>Profile details will be visible publicly.</h4>

        <div className="photo-container">
          <ImageLoader
            src={profileDTO.profilePhotos?.medium ?? dpGeneric}
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
              <td className="detail-value">{profileDTO.mobile ?? "(Unavailable)"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
