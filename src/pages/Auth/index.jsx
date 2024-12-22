import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthStateEnum } from "../../contexts/auth.js";
import { PageUrls } from "../../modules/util/pageUrls.js";
import useUsrCompositeCtx from "../../hooks/compositeUser.js";
import LoadingPage from "../Loading/index.jsx";
import ButtonText from "../../components/ButtonText";
import ImageLoader from "../../components/ImageLoader/index.jsx";

import LoginSection from "./SectionLogin.jsx";
import RegisterSection from "./SectionRegister.jsx";
import ResetPasswdSection from "./SectionResetPasswd.jsx";
import OAuthSection from "./SectionOAuth.jsx";

// @ts-ignore
import dpMevorisha from "../../assets/images/dpMevorisha.png";
import "./styles.css";

function SectionButtons({ showSection, setShowSection }) {
  return (
    <div className="button-container">
      <ButtonText
        title="Login"
        onClick={() => setShowSection("login")}
        rounded="all"
        kind={
          showSection === "login"
            ? "primary"
            : showSection === "resetPasswd"
            ? "secondary"
            : "cannibalized"
        }
        width="50%"
      />
      <ButtonText
        title="Register"
        onClick={() => setShowSection("register")}
        rounded="all"
        kind={showSection === "register" ? "primary" : "cannibalized"}
        width="50%"
      />
    </div>
  );
}

export default function Auth() {
  const [showSection, setShowSection] = React.useState(
    /** @type {"login" | "register" | "resetPasswd"} */ ("login")
  );

  const compUsrCtx = useUsrCompositeCtx();
  const navigate = useNavigate();

  useEffect(() => {
    if (compUsrCtx.authCtx.state === AuthStateEnum.LOGGED_IN) {
      navigate(PageUrls.ROOT);
    }
  }, [compUsrCtx.authCtx.state, navigate]);

  if (compUsrCtx.authCtx.state === "LOGGED_IN") return <LoadingPage />;

  return (
    <div className="pages-Auth">
      <span>
        <ImageLoader className="logo" src={dpMevorisha} alt="logo" />
      </span>
      <span>
        <h1>Mevorisha</h1>
      </span>
      <span>
        <h2>Mess Booking App</h2>
      </span>
      <div className="container">
        <SectionButtons
          showSection={showSection}
          setShowSection={setShowSection}
        />
        {
          /* login form */
          showSection === "login" ? (
            <LoginSection setShowSection={setShowSection} />
          ) : showSection === "register" ? (
            <RegisterSection />
          ) : showSection === "resetPasswd" ? (
            <ResetPasswdSection />
          ) : null
        }
        {/* implement login with Google, Apple & Microsoft */}
        <OAuthSection />
      </div>
    </div>
  );
}
