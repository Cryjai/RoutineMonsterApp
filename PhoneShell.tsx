import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

export function PhoneShell({
  children,
  hideNav = false,
  title,
}: {
  children: ReactNode;
  hideNav?: boolean;
  title?: string;
}) {
  return (
    <div className="phone-shell flex flex-col" data-testid="phone-shell">
      <TopBar title={title} />
      <main className="flex-1 px-4 pb-32 pt-3" data-testid="page-main">
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
