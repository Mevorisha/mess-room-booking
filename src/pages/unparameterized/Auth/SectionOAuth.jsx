import React from "react";

import { GoogleAuth } from "../../../modules/firebase/auth.js";

import useNotification from "../../../hooks/notification.js";

import ImageLoader from "../../../components/ImageLoader";

/**
 * @returns {React.JSX.Element}
 */
export default function OAuthSection() {
  const notify = useNotification();

  return (
    <div className="oauth-container">
      <div
        className="oauth-button"
        onClick={() => GoogleAuth.login().catch((e) => notify(e, "error"))}
      >
        <ImageLoader
          style={{
            height: "26px",
            paddingTop: "0.5px",
            paddingLeft: "1px",
          }}
          src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
          alt="google"
        />
      </div>
      <div
        className="oauth-button"
        onClick={() => notify("Apple Sign In is not implemented yet", "error")}
      >
        <ImageLoader
          style={{ height: "24px", paddingBottom: "1.5px" }}
          src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
          alt="apple"
        />
      </div>
      <div
        className="oauth-button"
        onClick={() =>
          notify("Microsoft Sign In is not implemented yet", "error")
        }
      >
        <ImageLoader
          style={{ height: "24px" }}
          src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
          alt="microsoft"
        />
      </div>
    </div>
  );
}
