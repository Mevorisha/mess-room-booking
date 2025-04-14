import React from "react";
import ButtonText from "@/components/ButtonText";
import NavBars from "@/components/NavBars";
import User from "@/modules/classes/User";

export default function HomeForTenant({ user: _ }: { user: User }): React.ReactNode {
  return (
    <div className="pages-Home">
      <NavBars>
        <>
          <ButtonText rounded="all" title="Rooms" kind="primary" width="50%" />
          <ButtonText rounded="all" title="Booking" kind="cannibalized" width="50%" />
        </>
      </NavBars>
      <div className="content-container">
        <div className="contents">
          <ul className="content-list">
            <li className="content-item"></li>
            <li className="content-item"></li>
            <li className="content-item"></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
