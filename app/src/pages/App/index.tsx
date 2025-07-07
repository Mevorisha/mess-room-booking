import React, { useEffect } from "react";
import { useNavigate, BrowserRouter, Route, Routes } from "react-router-dom";

import { PagePaths, PageType } from "@/modules/util/pageUrls.js";

import { UserProvider } from "@/contexts/user.jsx";
import { AuthProvider, AuthStateEnum } from "@/contexts/auth.jsx";
import { AccountProvider } from "@/contexts/account.jsx";
import { ProfileProvider } from "@/contexts/profile.jsx";
import { IdentityProvider } from "@/contexts/identity.jsx";
import { NotificationProvider } from "@/contexts/notification.jsx";
import { DialogBoxProvider } from "@/contexts/dialogbox.jsx";
import { LanguageProvider } from "@/contexts/language.jsx";

import useCompositeUser from "@/hooks/compositeUser.js";

import PageNotFound from "@/pages/unparameterized/PageNotFound";
import LoadingPage from "@/pages/unparameterized/Loading";
import AuthPage from "@/pages/unparameterized/Auth";
import HomePage from "@/pages/unparameterized/Home";
import OnboardingPage from "@/pages/parameterized/Onboarding";
import ProfilePage from "@/pages/parameterized/Profile";

function AuthCheck({ children }: { children: React.ReactNode }): React.ReactNode {
  const compUsr = useCompositeUser();
  const navigate = useNavigate();

  useEffect(() => {
    /* routing is not loaded if still loading, so prevent all
       redirects to avoid unnecessary errors */
    if (compUsr.authCtx.state === AuthStateEnum.STILL_LOADING) return;

    /* redirect to auth page if user state is loaded
       and user is not logged in */
    if (compUsr.authCtx.state === AuthStateEnum.NOT_LOGGED_IN) {
      navigate(PageType.AUTH);
    }
  }, [compUsr.authCtx.state, navigate]);

  /* show loading page if the auth state is still loading
     and do not render routing */
  if (compUsr.authCtx.state === AuthStateEnum.STILL_LOADING) {
    return <LoadingPage />;
  }

  /* render routing instead of directly loading some page
     and let the pages navigate to the correct page */
  return <>{children}</>;
}

function CompositeUsrProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <UserProvider>
      <LanguageProvider>
        <AuthProvider>
          <AccountProvider>
            <ProfileProvider>
              <IdentityProvider>{children}</IdentityProvider>
            </ProfileProvider>
          </AccountProvider>
        </AuthProvider>
      </LanguageProvider>
    </UserProvider>
  );
}

export default function App(): React.ReactNode {
  // prettier-ignore
  return (
    <BrowserRouter>                       {/* use the browser router to handle routing */}
      <NotificationProvider>              {/* provide the notification context */}
        <DialogBoxProvider>               {/* provide the dialog box context */}
          <CompositeUsrProvider>          {/* provides multple functions; used to handle user state */}
            <AuthCheck>                   {/* redirect to /home if user is logged in, else redirect to /auth */}
              <Routes>
                <Route path={PagePaths[PageType.ROOT]} Component={HomePage} />
                <Route path={PagePaths[PageType.ONBOARDING]} Component={OnboardingPage} />
                <Route path={PagePaths[PageType.AUTH]} Component={AuthPage} />
                <Route path={PagePaths[PageType.HOME]} Component={HomePage} />
                <Route path={PagePaths[PageType.PROFILE]} Component={ProfilePage} />
                {/*
                  <Route path="/notif" component={NotifPage} />
                  <Route path="/account" component={AccountPage} />
                */}
                <Route path={PagePaths[PageType.PAGE_NOT_FOUND]} Component={PageNotFound} />
                <Route path="*" Component={PageNotFound} />
              </Routes>
            </AuthCheck>
          </CompositeUsrProvider>
        </DialogBoxProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
