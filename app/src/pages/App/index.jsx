import React, { useEffect } from "react";
import { useNavigate, BrowserRouter, Route, Routes } from "react-router-dom";
import { NotificationProvider } from "../../contexts/notification.js";
import { AuthProvider } from "../../contexts/auth.js";
import useAuth from "../../hooks/auth.js";
import Notification from "../../components/Notification";
import LoadingPage from "../../pages/Loading";
import AuthPage from "../../pages/Auth";
import HomePage from "../../pages/Home";
// import NotifPage from "../../pages/Notif";
// import ProfilePage from "../../pages/Profile";
// import AccountPage from "../../pages/Account";

function AuthCheck() {
  const navigate = useNavigate();
  const user = useAuth();
  useEffect(() => {
    if (!user) navigate("/");
    else if (!user.uid) navigate("/auth");
    else if (user.uid) navigate("/home");
  }, [user, navigate]);
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
            <Route path="/auth" Component={AuthPage} />
            <Route path="/home" Component={HomePage} />
            {/*
              <Route path="/notif" component={NotifPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/account" component={AccountPage} />
            */}
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}
