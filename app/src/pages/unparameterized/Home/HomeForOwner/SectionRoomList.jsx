import React from "react";
import { lang } from "@/modules/util/language";

/**
 * @returns {React.JSX.Element}
 */
export default function SectionRooms() {
  return (
    <div className="section-container">
      <div className="section-header">
        <h2>{lang("Rooms", "রুম", "रूम")}</h2>
      </div>
      <ul className="content-list">
        <li className="content-item"></li>
        <li className="content-item"></li>
        <li className="content-item"></li>
      </ul>
    </div>
  );
}
