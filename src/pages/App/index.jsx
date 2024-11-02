import React, { useEffect } from "react";
import {
  useNavigate,
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { NotificationProvider } from "../../contexts/notification.js";
import { AuthProvider, AuthStateEnum } from "../../contexts/auth.js";
import useAuth from "../../hooks/auth.js";
import Notification from "../../components/Notification";
import PageNotFound from "../PageNotFound/index.jsx";
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
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (!VALID_PATHS.includes(location.pathname)) navigate("/404");
    else if (auth.state === AuthStateEnum.STILL_LOADING) navigate("/");
    else if (auth.state === AuthStateEnum.NOT_LOGGED_IN) navigate("/auth");
    else if (auth.state === AuthStateEnum.LOGGED_IN) {
      if (auth.user.type === "EMPTY") navigate("/onboarding");
      else if (!auth.user.mobile) navigate("/onboarding");
      else navigate("/home");
    }
  }, [auth.state, auth.user.type, auth.user.mobile, navigate]);

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
