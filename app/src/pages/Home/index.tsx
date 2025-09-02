import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ActionType, PagePaths, PageType } from "@/modules/util/pageUrls.js";

import useCompositeUser from "@/hooks/compositeUser.js";

import LoadingPage from "@/pages/Loading";
import HomeForOwner from "./HomeForOwner";
import HomeForTenant from "./HomeForTenant";
import { getLangOrNull } from "@/modules/util/language";
import { IdentityType } from "sharedtypes";

export default function Home(): React.ReactNode {
  const compUsr = useCompositeUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // user logged in but profile type not set
    if (compUsr.userCtx.user.get("type") == null) {
      searchParams.set("action", ActionType.SWITCH_PROFILE_TYPE);
      navigate({
        pathname: PagePaths[PageType.ONBOARDING],
        search: searchParams.toString(),
      });
    }

    // user logged in but mobile number not set
    else if (compUsr.userCtx.user.get("mobile") == null) {
      searchParams.set("action", ActionType.CHANGE_MOBILE_NUMBER);
      navigate({
        pathname: PagePaths[PageType.ONBOARDING],
        search: searchParams.toString(),
      });
    }

    // user logged in but no language set
    else if (getLangOrNull() == null) {
      searchParams.set("action", ActionType.CHANGE_LANGUAGE);
      navigate({
        pathname: PagePaths[PageType.ONBOARDING],
        search: searchParams.toString(),
      });
    }
  }, [compUsr.userCtx.user, searchParams, navigate]);

  // user logged in but not onboarded
  if (
    compUsr.userCtx.user.get("type") == null ||
    compUsr.userCtx.user.get("mobile") == null ||
    getLangOrNull() == null
  ) {
    return <LoadingPage />;
  }

  // home page content
  return compUsr.userCtx.user.get("type") === IdentityType.TENANT ? (
    <HomeForTenant user={compUsr.userCtx.user} />
  ) : (
    <HomeForOwner user={compUsr.userCtx.user} />
  );
}
