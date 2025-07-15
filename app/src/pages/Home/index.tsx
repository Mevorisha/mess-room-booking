import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { isEmpty } from "@/modules/util/validations.js";
import { ActionType, PagePaths, PageType } from "@/modules/util/pageUrls.js";

import useCompositeUser from "@/hooks/compositeUser.js";

import LoadingPage from "@/pages/Loading";
import HomeForOwner from "./HomeForOwner";
import HomeForTenant from "./HomeForTenant";

export default function Home(): React.ReactNode {
  const compUsr = useCompositeUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // user logged in but profile type not set
    if (isEmpty(compUsr.userCtx.user.type)) {
      searchParams.set("action", ActionType.SWITCH_PROFILE_TYPE);
      navigate({
        pathname: PagePaths[PageType.ONBOARDING],
        search: searchParams.toString(),
      });
    }

    // user logged in but mobile number not set
    else if (isEmpty(compUsr.userCtx.user.mobile)) {
      searchParams.set("action", ActionType.CHANGE_MOBILE_NUMBER);
      navigate({
        pathname: PagePaths[PageType.ONBOARDING],
        search: searchParams.toString(),
      });
    }

    // user logged in but no language set
    else if (isEmpty(window.localStorage.getItem("lang"))) {
      searchParams.set("action", ActionType.CHANGE_LANGUAGE);
      navigate({
        pathname: PagePaths[PageType.ONBOARDING],
        search: searchParams.toString(),
      });
    }
  }, [compUsr.userCtx.user.type, compUsr.userCtx.user.mobile, searchParams, navigate]);

  // user logged in but not onboarded
  if (
    isEmpty(compUsr.userCtx.user.type) ||
    isEmpty(compUsr.userCtx.user.mobile) ||
    isEmpty(window.localStorage.getItem("lang"))
  ) {
    return <LoadingPage />;
  }

  // home page content
  return compUsr.userCtx.user.type === "TENANT" ? (
    <HomeForTenant user={compUsr.userCtx.user} />
  ) : (
    <HomeForOwner user={compUsr.userCtx.user} />
  );
}
