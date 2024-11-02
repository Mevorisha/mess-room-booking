import React from "react";
import "./styles.css";

export default function PageNotFound() {
  return (
    <div className="pages-PageNotFound">
      <div className="container">
        <h1>404</h1>
        <h4>Page Not Found</h4>

        <div className="desc">
          <p>
            The resource you are looking for doesn't exist or has been
            removed.
          </p>
        </div>
      </div>
    </div>
  );
}
