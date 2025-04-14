import React from "react";
import { useSearchParams } from "react-router-dom";

import { AuthStateEnum } from "@/contexts/auth.jsx";
import { isEmpty } from "@/modules/util/validations.js";
import { ActionType } from "@/modules/util/pageUrls.js";

import useCompositeUser from "@/hooks/compositeUser.js";

import SetLanguage from "./SectionLanguage";
import SetDisplayName from "./SectionDisplayName";
import SetMobileNumber from "./SectionMobileNo";
import SetProfilePhoto from "./SectionProfilePhoto";
import SetProfileType from "./SectionProfileType";
import SetIdentityDocs from "./SectionIdentiyDocs";

import PageNotFound from "@/pages/unparameterized/PageNotFound";

import "./styles.css";

/**
 * @returns {React.ReactNode}
 */
export default function Onboarding(): React.ReactNode {
  const compUsr = useCompositeUser();
  const [searchParams] = useSearchParams();

  if (searchParams.has("action"))
    switch (searchParams.get("action") as ActionType) {
      case ActionType.SWITCH_PROFILE_TYPE:
        return <SetProfileType />;
      case ActionType.CHANGE_NAME:
        return <SetDisplayName />;
      case ActionType.CHANGE_MOBILE_NUMBER:
        return <SetMobileNumber />;
      case ActionType.UPDATE_PROFILE_PHOTO:
        return <SetProfilePhoto />;
      case ActionType.UPDATE_ID_DOCS:
        return <SetIdentityDocs />;
      case ActionType.CHANGE_LANGUAGE:
        return <SetLanguage />;
      case ActionType.VIEW_PROFILE:
      case ActionType.RESET_PASSWORD:
      case ActionType.LOGOUT:
      default:
        return <PageNotFound />;
    }

  if (compUsr.authCtx.state === AuthStateEnum.STILL_LOADING) return <></>;
  if (isEmpty(compUsr.userCtx.user.type)) return <SetProfileType />;
  if (isEmpty(compUsr.userCtx.user.mobile)) return <SetMobileNumber />;
  if (isEmpty(window.localStorage.getItem("lang"))) return <SetLanguage />;

  return <PageNotFound />;
}
