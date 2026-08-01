"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { SuperAdminSidebar } from "@/components/layout/SuperAdminSidebar";
import { AuthGuard } from "@/components/layout/AuthGuard";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("superAdmin.nav");
  const pageTitle = t("dashboard");

  return (
    <AuthGuard requireSuperAdmin>
      <div className="flex min-h-screen bg-bg">
        <SuperAdminSidebar />

        <div className="flex-1 transition-all md:ml-[240px]">
          <Header
            pageTitle={pageTitle}
            showMenuButton
            hideYearSelector
          />
          <main className="min-w-0 p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
