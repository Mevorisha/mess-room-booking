import React from "react";
import { useNavigate } from "react-router-dom";

import { PageType } from "@/modules/util/pageUrls.js";

import ButtonText from "@/components/ButtonText";

import "./styles.css";

/**
 * @returns {React.JSX.Element}
 */
export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <div className="pages-PageNotFound">
      <div className="container">
        <h1>404</h1>
        <h4>Page Not Found</h4>

        <div className="desc">
          <p>The resource you are looking for doesn't exist or has been removed.</p>
        </div>
        <ButtonText rounded="all" title="Go Home" kind="primary" onClick={() => navigate(PageType.HOME)} />
      </div>
    </div>
  );
}
