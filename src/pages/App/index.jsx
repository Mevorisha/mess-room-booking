import React, { useEffect } from "react";
import {
  useNavigate,
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { NotificationProvider } from "../../contexts/notification.js";
import { AuthProvider, AuthStateEnum } from "../../contexts/auth.js";
import { isEmpty } from "../../modules/util/validations.js";
import { TopBarActions } from "../../components/TopBar";
import useAuth from "../../hooks/auth.js";
import Notification from "../../components/Notification";
import PageNotFound from "../PageNotFound";
import LoadingPage from "../../pages/Loading";
import AuthPage from "../../pages/Auth";
import OnboardingPage from "../../pages/Onboarding";
import HomePage from "../../pages/Home";
// import NotifPage from "../../pages/Notif";
// import ProfilePage from "../../pages/Profile";
// import AccountPage from "../../pages/Account";

const VALID_PATHS = ["/", "/onboarding", "/auth", "/home"];

function AuthCheck() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    // redirect to /404 if path is not valid
    if (!VALID_PATHS.includes(location.pathname)) navigate("/404");
    // show loading page is user state is still loading
    else if (auth.state === AuthStateEnum.STILL_LOADING) navigate("/");
    // redirect to /auth if user is not logged in
    else if (auth.state === AuthStateEnum.NOT_LOGGED_IN) navigate("/auth");
    // if logged in there is work to be done
    else if (auth.state === AuthStateEnum.LOGGED_IN) {
      // user type is not set
      if (isEmpty(auth.user.type)) {
        navigate("/onboarding");
      }

      // user mobile number is not set
      else if (isEmpty(auth.user.mobile)) {
        navigate("/onboarding");
      }

      // conditional navigation based on the action param
      else if (searchParams.has("action")) {
        switch (searchParams.get("action")) {
          case TopBarActions.VIEW_PROFILE:
            navigate("/profile");
            break;
          case TopBarActions.CHANGE_NAME:
            navigate({
              pathname: "/onboarding",
              search: searchParams.toString(),
            });
            break;
          case TopBarActions.CHANGE_MOBILE_NUMBER:
            navigate({
              pathname: "/onboarding",
              search: searchParams.toString(),
            });
            break;
          case TopBarActions.SWITCH_PROFILE_TYPE:
            navigate({
              pathname: "/onboarding",
              search: searchParams.toString(),
            });
            break;
          case TopBarActions.UPDATE_PROFILE_PHOTO:
            navigate({
              pathname: "/onboarding",
              search: searchParams.toString(),
            });
            break;
          case TopBarActions.UPDATE_ID_DOCS:
            navigate({
              pathname: "/onboarding",
              search: searchParams.toString(),
            });
            break;

          // no action required but not /404
          case TopBarActions.RESET_PASSWORD:
          case TopBarActions.LOGOUT:
            break;

          // default to /404 if param is not recognized
          default:
            navigate("/404");
            break;
        }
      }

      // default to /home if no action param and no paths are matched
      else {
        navigate("/home");
      }
    }
  }, [auth.state, auth.user.type, auth.user.mobile, navigate, searchParams]);

  return null;
}

export default function App() {
  return (
    <NotificationProvider>            {/* provide the notification context */}
      <AuthProvider>                  {/* provide the auth context; used to handle user state */}
        <BrowserRouter>               {/* use the browser router to handle routing */}
          <Notification />            {/* display notifications */}
          <AuthCheck />               {/* redirect to /home if user is logged in, else redirect to /auth */}
          <Routes>
            <Route path="/" Component={LoadingPage} />
            <Route path="/onboarding" Component={OnboardingPage} />
            <Route path="/auth" Component={AuthPage} />
            <Route path="/home" Component={HomePage} />
            {/*
              <Route path="/notif" component={NotifPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/account" component={AccountPage} />
            */}
            <Route path="/404" Component={PageNotFound} />
            <Route path="*" Component={PageNotFound} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}
