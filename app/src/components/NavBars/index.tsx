import React from "react";
import TopBar from "./TopBar";
import BottomBar from "./BottomBar";

export default function NavBars({ children = <></> }: { children?: React.JSX.Element }): React.JSX.Element {
  return (
    <>
      <TopBar children={children} />
      <BottomBar children={children} />
    </>
  );
}
