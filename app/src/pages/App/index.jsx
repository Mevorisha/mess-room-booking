import React, { useEffect } from "react";
import { BrowserRouter, Route, useNavigate } from "react-router-dom";

import { isLoggedIn } from "../../modules/firebase/auth.js";
import useNotification from "../../hooks/notification.js";

import AuthPage from "../../pages/Auth";
import Notification from "../../components/Notification";
// import HomePage from "../../pages/Home";
// import NotifPage from "../../pages/Notif";
// import ProfilePage from "../../pages/Profile";
// import AccountPage from "../../pages/Account";

export default function App() {
  const navigate = useNavigate();
  const { notify, currentNotification } = useNotification();

  // check if user is logged in
  useEffect(() => {
    isLoggedIn()
      .then(() => navigate("/home"))
      .catch(() => navigate("/auth"));
  }, []);

  // testing notifications
  useEffect(() => {
    notify("This is an info message", "info");
    notify("This is a success message", "success");
    notify("This is a warning message", "warning");
    notify("This is an error message", "error");
  }, []);

  return (
    <>
      <Notification message={currentNotification.message} kind={currentNotification.kind} />

      <BrowserRouter>
        <Route path="/auth" Component={AuthPage} />
        {/*
          <Route path="/home" component={HomePage} />
          <Route path="/notif" component={NotifPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/account" component={AccountPage} />
        */}
      </BrowserRouter>
    </>
  );
}
