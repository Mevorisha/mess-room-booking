import React, { useContext, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthPage from "../../pages/Auth";
import Notification from "../../components/Notification";
import { NotificationProvider } from "../../contexts/notification";
// import HomePage from "../../pages/Home";
// import NotifPage from "../../pages/Notif";
// import ProfilePage from "../../pages/Profile";
// import AccountPage from "../../pages/Account";

export default function App() {
  return (
    <NotificationProvider>
      <Notification />
      <BrowserRouter>
        <Routes>
          <Route path="/" Component={AuthPage} />
          <Route path="/auth" Component={AuthPage} />
          {/*
              <Route path="/home" component={HomePage} />
              <Route path="/notif" component={NotifPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/account" component={AccountPage} />
            */}
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}
