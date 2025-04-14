import React from "react";

export default function BottomBar({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <div className="components-BottomBar">
      <div className="section-buttons-container">{children}</div>
    </div>
  );
}
