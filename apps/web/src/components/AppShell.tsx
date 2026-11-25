import type { ReactNode } from "react";

import { Header } from "./Header";

export interface AppShellProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  children: ReactNode;
}

export function AppShell({ title, showBack = true, onBack, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header title={title} showBack={showBack} onBack={onBack} />
      <main className="mx-auto w-full max-w-app px-4 py-4">{children}</main>
    </div>
  );
}
