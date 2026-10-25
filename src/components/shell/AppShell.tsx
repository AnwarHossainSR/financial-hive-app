"use client";

import { AppSidebar } from "./AppSidebar";
import { MobileTabBar } from "./MobileTabBar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Soft brand wash behind the top of every page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/[0.06] to-transparent"
      />
      <AppSidebar />
      <div className="relative md:pl-[76px] lg:pl-64">
        <TopBar />
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
