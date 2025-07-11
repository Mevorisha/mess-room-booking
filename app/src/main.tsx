import React from "react";
import ReactDOM from "react-dom/client";
import App from "./pages/App";

import "./globals/index.css";
import "./globals/colors.css";
import "./globals/look.css";

const root = ReactDOM.createRoot(document.getElementById("root") ?? document.createElement("div"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
