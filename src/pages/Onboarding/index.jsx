import React from "react";
import { useSearchParams } from "react-router-dom";
import { AuthStateEnum } from "../../contexts/auth";
import { isEmpty } from "../../modules/util/validations.js";
import { ActionParams } from "../../modules/util/pageUrls.js";
import PageNotFound from "../PageNotFound";
import useAuth from "../../hooks/auth.js";

import SetDisplayName from "./SectionDisplayName";
import SetMobileNumber from "./SectionMobileNo";
import SetProfilePhoto from "./SectionProfilePhoto";
import SelectInitialType from "./SectionProfileType";

import "./styles.css";

/**
 * @returns {React.JSX.Element}
 */
export default function Onboarding() {
  const auth = useAuth();
  const [searchParams] = useSearchParams();

  if (searchParams.has("action"))
    switch (searchParams.get("action")) {
      case ActionParams.SWITCH_PROFILE_TYPE:
        return <SelectInitialType />;
      case ActionParams.CHANGE_NAME:
        return <SetDisplayName />;
      case ActionParams.CHANGE_MOBILE_NUMBER:
        return <SetMobileNumber />;
      case ActionParams.UPDATE_PROFILE_PHOTO:
        return <SetProfilePhoto />;
      default:
        return <PageNotFound />;
    }

  if (auth.state === AuthStateEnum.STILL_LOADING) return <></>;
  if (isEmpty(auth.user.type)) return <SelectInitialType />;
  if (isEmpty(auth.user.mobile)) return <SetMobileNumber />;

  return <PageNotFound />;
}
