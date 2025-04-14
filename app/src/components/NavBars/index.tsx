import React from "react";
import TopBar from "./TopBar";
import BottomBar from "./BottomBar";

export default function NavBars({ children = <></> }: { children?: React.ReactNode }): React.ReactNode {
  return (
    <>
      <TopBar children={children} />
      <BottomBar children={children} />
    </>
  );
}
