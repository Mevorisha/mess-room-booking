import React from "react";
import ReactDOM from "react-dom/client";
import App from "./pages/App";
import { logInfo } from "./modules/firebase/util";


import "./globals/index.css";
import "./globals/colors.css";
import "./globals/look.css";

/**
 * @param {import("web-vitals").ReportHandler} onPerfEntry
 */
function reportWebVitals(onPerfEntry) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
}

const root = ReactDOM.createRoot(
  document.getElementById("root") || document.createElement("div")
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(console.log);
// reportWebVitals((m) => logInfo("report_web_vitals", JSON.stringify(m)));
