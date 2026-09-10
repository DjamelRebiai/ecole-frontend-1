"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/AuthContext";

export function AuthGuard({
  children,
  requireSuperAdmin,
  serviceType,
}: {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  serviceType?: "school" | "sports_hall";
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (requireSuperAdmin && !user.is_super_admin) {
      router.replace("/dashboard");
      return;
    }

    if (serviceType) {
      const actual = user.service_type as string;
      if (actual !== serviceType) {
        router.replace(
          user.is_super_admin ? "/super-admin/dashboard" : "/dashboard",
        );
      }
    }
  }, [user, isLoading, requireSuperAdmin, serviceType, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    );
  }

  if (!user) return null;

  if (requireSuperAdmin && !user.is_super_admin) return null;

  if (serviceType && (user.service_type as string) !== serviceType) return null;

  return <>{children}</>;
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      if (user.is_super_admin) {
        router.replace("/super-admin/dashboard");
      } else if (user.service_type === "sports_hall") {
        router.replace("/sports-hall/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    );
  }

  return <>{children}</>;
}
