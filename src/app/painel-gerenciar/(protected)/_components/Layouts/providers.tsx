"use client";

import { SidebarProvider } from "./sidebar/sidebar-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
