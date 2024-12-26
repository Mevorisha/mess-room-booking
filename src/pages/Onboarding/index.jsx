import React from "react";
import { useSearchParams } from "react-router-dom";
import { AuthStateEnum } from "../../contexts/auth.js";
import { isEmpty } from "../../modules/util/validations.js";
import { ActionParams } from "../../modules/util/pageUrls.js";
import PageNotFound from "../PageNotFound";
import useUsrCompositeCtx from "../../hooks/compositeUser.js";

import SetDisplayName from "./SectionDisplayName";
import SetMobileNumber from "./SectionMobileNo";
import SetProfilePhoto from "./SectionProfilePhoto";
import SetProfileType from "./SectionProfileType";
import SetIdentityDocs from "./SectionIdentiyDocs";

import "./styles.css";

/**
 * @returns {React.JSX.Element}
 */
export default function Onboarding() {
  const compUsrCtx = useUsrCompositeCtx();
  const [searchParams] = useSearchParams();

  if (searchParams.has("action"))
    switch (searchParams.get("action")) {
      case ActionParams.SWITCH_PROFILE_TYPE:
        return <SetProfileType />;
      case ActionParams.CHANGE_NAME:
        return <SetDisplayName />;
      case ActionParams.CHANGE_MOBILE_NUMBER:
        return <SetMobileNumber />;
      case ActionParams.UPDATE_PROFILE_PHOTO:
        return <SetProfilePhoto />;
      case ActionParams.UPDATE_ID_DOCS:
        return <SetIdentityDocs />;
      default:
        return <PageNotFound />;
    }

  if (compUsrCtx.authCtx.state === AuthStateEnum.STILL_LOADING) return <></>;
  if (isEmpty(compUsrCtx.userCtx.user.type)) return <SetProfileType />;
  if (isEmpty(compUsrCtx.userCtx.user.mobile)) return <SetMobileNumber />;

  return <PageNotFound />;
}
