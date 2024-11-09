import React, { useEffect } from "react";
import { useNavigate, BrowserRouter, Route, Routes } from "react-router-dom";
import { NotificationProvider } from "../../contexts/notification.js";
import { AuthProvider, AuthStateEnum } from "../../contexts/auth.js";
import { PageUrls } from "../../modules/util/pageUrls.js";
import useAuth from "../../hooks/auth.js";
import Notification from "../../components/Notification";
import PageNotFound from "../PageNotFound";
import AuthPage from "../../pages/Auth";
import OnboardingPage from "../../pages/Onboarding";
import HomePage from "../../pages/Home";
import ProfilePage from "../../pages/Profile";
import LoadingPage from "../Loading/index.jsx";
// import NotifPage from "../../pages/Notif";
// import AccountPage from "../../pages/Account";

function AuthCheck({ children }) {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    /* routing is not loaded if still loading, so prevent all
       redirects to avoid unnecessary errors */
    if (auth.state === AuthStateEnum.STILL_LOADING) return;

    /* redirect to auth page if user state is loaded
       and user is not logged in */
    if (auth.state === AuthStateEnum.NOT_LOGGED_IN) {
      navigate(PageUrls.AUTH);
    }
  }, [auth.state, navigate]);

  /* show loading page if the auth state is still loading
     and do not render routing */
  if (auth.state === AuthStateEnum.STILL_LOADING)
    return <LoadingPage />;

  /* render routing instead of directly loading some page
     and let the pages navigate to the correct page */
  return children;
}

export default function App() {
  return (
    <NotificationProvider>            {/* provide the notification context */}
      <AuthProvider>                  {/* provide the auth context; used to handle user state */}
        <BrowserRouter>               {/* use the browser router to handle routing */}
          <Notification />            {/* display notifications */}
          <AuthCheck>               {/* redirect to /home if user is logged in, else redirect to /auth */}
            <Routes>
              <Route path={PageUrls.ROOT} Component={HomePage} />
              <Route path={PageUrls.ONBOARDING} Component={OnboardingPage} />
              <Route path={PageUrls.AUTH} Component={AuthPage} />
              <Route path={PageUrls.HOME} Component={HomePage} />
              <Route path={PageUrls.PROFILE} Component={ProfilePage} />
              {/*
                <Route path="/notif" component={NotifPage} />
                <Route path="/account" component={AccountPage} />
              */}
              <Route path={PageUrls.PAGE_NOT_FOUND} Component={PageNotFound} />
              <Route path="*" Component={PageNotFound} />
            </Routes>
          </AuthCheck>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}
