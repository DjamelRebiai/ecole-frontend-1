"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { AlertCircle, GraduationCap, Dumbbell, ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { GuestGuard } from "@/components/layout/AuthGuard";
import { useAuth } from "@/lib/auth/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { LoginBackgroundSlideshow } from "@/components/auth/BackgroundSlideshow";
import { cn } from "@/lib/utils";

type ServiceType = "school" | "sports_hall";

const SERVICE_IMAGES = {
  school: "/ecole1.png",
  sports_hall: "/create-a-premium-fitness-advertisement-featuring-a.png",
};

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { login } = useAuth();
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isStep1 = serviceType === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError(t("errors.required"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("errors.invalidEmail"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);

      if (user.is_super_admin) {
        router.push("/super-admin/dashboard");
      } else if (user.service_type === "sports_hall") {
        router.push("/sports-hall/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.invalid");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const types: {
    value: ServiceType;
    icon: typeof GraduationCap;
    arLabel: string;
    enLabel: string;
    arDesc: string;
    enDesc: string;
    activeCls: string;
  }[] = [
    {
      value: "school",
      icon: GraduationCap,
      arLabel: "مدرسة",
      enLabel: "School",
      arDesc: "إدارة المدارس الخاصة",
      enDesc: "Private school management",
      activeCls: "border-emerald-300 bg-emerald-500/25 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)]",
    },
    {
      value: "sports_hall",
      icon: Dumbbell,
      arLabel: "قاعة رياضية",
      enLabel: "Sports Hall",
      arDesc: "إدارة القاعات الرياضية",
      enDesc: "Sports hall management",
      activeCls: "border-orange-300 bg-orange-500/25 text-white shadow-[0_4px_16px_rgba(249,115,22,0.35)]",
    },
  ];

return (
    <GuestGuard>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-5">
        <LoginBackgroundSlideshow />
        <Image
          src={SERVICE_IMAGES.school}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className={cn(
            "object-cover transition-opacity duration-700 ease-in-out",
            serviceType === "school" ? "opacity-100" : "opacity-0"
          )}
        />
        <Image
          src={SERVICE_IMAGES.sports_hall}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className={cn(
            "object-cover transition-opacity duration-700 ease-in-out",
            serviceType === "sports_hall" ? "opacity-100" : "opacity-0"
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />

        <div className="relative z-10 my-6 w-full max-w-[460px] rounded-3xl border border-white/30 bg-white/10 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-10">
          <div className="absolute end-4 top-4">
            <LanguageSwitcher />
          </div>

          <div className="mb-2 text-center">
            <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-white/40 bg-white/90 p-2 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
              <Logo alt="DJO" priority className="h-full w-auto" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
              {t("loginTitle")}
            </h1>
            <p className="mt-1 text-sm text-white/80">{t("loginSubtitle")}</p>
          </div>

          {isStep1 ? (
            <div className="mt-6 transition-opacity duration-300">
              <div className="mb-4 block text-center text-sm font-semibold text-white/90">
                {locale === "ar" ? "اختر نوع مؤسستك للمتابعة" : "Select your institution type to continue"}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {types.map((item) => {
                  const Icon = item.icon;
                  const isActive = serviceType === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setServiceType(item.value)}
                      className={cn(
                        "group flex h-[150px] flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] px-4 text-sm font-semibold backdrop-blur-md transition-all duration-300 hover:-translate-y-1",
                        isActive
                          ? item.activeCls
                          : "border-white/30 bg-white/10 text-white/75 hover:border-white/60 hover:bg-white/15 hover:text-white"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-12 w-12 place-items-center rounded-full transition-all duration-300",
                          isActive
                            ? item.value === "school"
                              ? "bg-emerald-400/30 text-emerald-200"
                              : "bg-orange-400/30 text-orange-200"
                            : "bg-white/10 text-white/80 group-hover:bg-white/20 group-hover:text-white"
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="text-base font-bold">
                        {locale === "ar" ? item.arLabel : item.enLabel}
                      </span>
                      <span className="text-xs font-normal opacity-80">
                        {locale === "ar" ? item.arDesc : item.enDesc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-6 transition-opacity duration-300">
              <button
                type="button"
                onClick={() => setServiceType(null)}
                className="mb-4 flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {locale === "ar" ? "تغيير نوع المؤسسة" : "Change institution type"}
              </button>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/15 px-3.5 py-2.5 text-sm text-red-100 backdrop-blur-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-5">
                  <label className="mb-1.5 block text-sm font-semibold text-white/90">
                    {t("email")}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/30 bg-white/15 px-3.5 py-3 text-[15px] text-white placeholder:text-white/50 outline-none transition-all backdrop-blur-md focus:border-accent focus:bg-white/20 focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="mb-5">
                  <label className="mb-1.5 block text-sm font-semibold text-white/90">
                    {t("password")}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    required
                    minLength={6}
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/30 bg-white/15 px-3.5 py-3 text-[15px] text-white placeholder:text-white/50 outline-none transition-all backdrop-blur-md focus:border-accent focus:bg-white/20 focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="mb-6 flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-1.5 text-white/80">
                    <input type="checkbox" className="h-4 w-4 accent-emerald-400" />
                    {t("rememberMe")}
                  </label>
                  <span className="font-medium text-emerald-300 cursor-default opacity-90">
                    {t("forgotPassword")}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-[0_6px_28px_rgba(16,185,129,0.65)] disabled:opacity-70"
                >
                  {loading ? t("signingIn") : t("signIn")}
                </button>
              </form>

              <div className="mt-5 text-center text-[13px] text-white/80">
                {t("noAccount")}{" "}
                <Link
                  href="/auth/register"
                  className="font-semibold text-emerald-300 hover:underline"
                >
                  {t("register")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </GuestGuard>
  );
}
