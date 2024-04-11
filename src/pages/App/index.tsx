import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "../Register";
import LogIn from "../LogIn";
import Home from "../Home";
import Profile from "../Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-up" element={<Register />} />
        <Route path="/sign-in" element={<LogIn />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
