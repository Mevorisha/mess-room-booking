import React from "react";
import TopBar from "./TopBar";
import BottomBar from "./BottomBar";

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export default function NavBars({ children }) {
  return (
    <>
      <TopBar children={children} />
      <BottomBar children={children} />
    </>
  );
}
