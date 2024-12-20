import React, { useEffect } from "react";
import { useNavigate, BrowserRouter, Route, Routes } from "react-router-dom";
import { NotificationProvider } from "../../contexts/notification.js";
import { DialogBoxProvider } from "../../contexts/dialogbox.js";
import { PageUrls } from "../../modules/util/pageUrls.js";
import useUsrCompositeCtx from "../../hooks/compositeUser.js";
import PageNotFound from "../PageNotFound";
import AuthPage from "../../pages/Auth";
import OnboardingPage from "../../pages/Onboarding";
import HomePage from "../../pages/Home";
import ProfilePage from "../../pages/Profile";
import LoadingPage from "../Loading/index.jsx";

import { UserProvider } from "../../contexts/user.js";
import { AuthProvider, AuthStateEnum } from "../../contexts/auth.js";
import { AccountProvider } from "../../contexts/account.js";
import { ProfileProvider } from "../../contexts/profile.js";
import { IdentityProvider } from "../../contexts/identity.js";

// import NotifPage from "../../pages/Notif";
// import AccountPage from "../../pages/Account";

function AuthCheck({ children }) {
  const compUsrCtx = useUsrCompositeCtx();
  const navigate = useNavigate();

  useEffect(() => {
    /* routing is not loaded if still loading, so prevent all
       redirects to avoid unnecessary errors */
    if (compUsrCtx.authCtx.state === AuthStateEnum.STILL_LOADING) return;

    /* redirect to auth page if user state is loaded
       and user is not logged in */
    if (compUsrCtx.authCtx.state === AuthStateEnum.NOT_LOGGED_IN) {
      navigate(PageUrls.AUTH);
    }
  }, [compUsrCtx.authCtx.state, navigate]);

  /* show loading page if the auth state is still loading
     and do not render routing */
  if (compUsrCtx.authCtx.state === AuthStateEnum.STILL_LOADING) {
    return <LoadingPage />;
  }

  /* render routing instead of directly loading some page
     and let the pages navigate to the correct page */
  return children;
}

function CompositeUsrProvider({ children }) {
  return (
    <UserProvider>
      <AuthProvider>
        <AccountProvider>
          <ProfileProvider>
            <IdentityProvider>{children}</IdentityProvider>
          </ProfileProvider>
        </AccountProvider>
      </AuthProvider>
    </UserProvider>
  );
}

export default function App() {
  // prettier-ignore
  return (
    <NotificationProvider>              {/* provide the notification context */}
      <DialogBoxProvider>               {/* provide the dialog box context */}
        <CompositeUsrProvider>          {/* provides multple functions; used to handle user state */}
          <BrowserRouter>               {/* use the browser router to handle routing */}
            <AuthCheck>                 {/* redirect to /home if user is logged in, else redirect to /auth */}
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
        </CompositeUsrProvider>
      </DialogBoxProvider>
    </NotificationProvider>
  );
}
