"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { SportsHallSidebar } from "@/components/layout/SportsHallSidebar";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { PageTitleProvider, usePageTitle } from "@/lib/page-title";

function SportsHallLayoutInner({ children }: { children: React.ReactNode }) {
  const t = useTranslations("sportsHall.nav");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { title } = usePageTitle();

  return (
    <div className="flex min-h-screen bg-bg">
      <SportsHallSidebar
        mobileOpen={mobileOpen}
        onMenuClick={() => setMobileOpen(!mobileOpen)}
      />

      <div className="flex-1 transition-all md:ms-[260px]">
        <Header
          pageTitle={title || t("dashboard")}
          onMenuClick={() => setMobileOpen(!mobileOpen)}
          showMenuButton
          hideYearSelector
        />
        <main className="min-w-0 p-6">{children}</main>
      </div>
    </div>
  );
}

export default function SportsHallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard serviceType="sports_hall">
      <PageTitleProvider>
        <SportsHallLayoutInner>{children}</SportsHallLayoutInner>
      </PageTitleProvider>
    </AuthGuard>
  );
}
