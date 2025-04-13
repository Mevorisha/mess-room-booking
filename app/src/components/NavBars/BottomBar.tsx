import React from "react";

export default function BottomBar({ children }: { children: React.JSX.Element }): React.JSX.Element {
  return (
    <div className="components-BottomBar">
      <div className="section-buttons-container">{children}</div>
    </div>
  );
}
