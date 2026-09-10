"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  GraduationCap,
  Dumbbell,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { GuestGuard } from "@/components/layout/AuthGuard";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api/client";
import { Logo } from "@/components/ui/Logo";

type ServiceType = "school" | "sports_hall";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tAuthErrors = useTranslations("auth.errors");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [serviceType, setServiceType] = useState<ServiceType>("school");
  const [name, setName] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !facilityName || !email || !password) {
      setError(t("errors.required"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("errors.invalidEmail"));
      return;
    }

    if (password.length < 8) {
      setError(tAuthErrors("invalid_length"));
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError(tAuthErrors("invalid_uppercase"));
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError(tAuthErrors("invalid_lowercase"));
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError(tAuthErrors("invalid_number"));
      return;
    }

    if (password !== confirmPassword) {
      setError(tCommon("confirmPassword"));
      return;
    }

    setLoading(true);

    try {
      await api.post("auth/register", {
        name,
        facilityName,
        email,
        password,
        service_type: serviceType,
        ...(serviceType === "school" ? { schoolName: facilityName } : {}),
      });
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("registration_failed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-5">
        <div className="absolute inset-0">
          <Image
            src="/ecole1.png"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className={`object-cover transition-all duration-700 ease-in-out ${
              serviceType === "school" ? "scale-100 opacity-100" : "scale-110 opacity-0"
            }`}
          />
          <Image
            src="/create-a-premium-fitness-advertisement-featuring-a1.png"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className={`object-cover transition-all duration-700 ease-in-out ${
              serviceType === "sports_hall" ? "scale-100 opacity-100" : "scale-110 opacity-0"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/55 to-black/70" />
        </div>

        <div className="relative z-10 my-6 w-full max-w-[460px] rounded-3xl border border-white/30 bg-white/10 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-10">
          <div className="absolute end-4 top-4">
            <LanguageSwitcher />
          </div>

          <div className="mb-2 text-center">
            <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-white/40 bg-white/90 p-2 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
              <Logo alt="DJO" priority className="h-full w-auto" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
              {locale === "ar" ? "إنشاء حساب جديد" : "Create Account"}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {locale === "ar"
                ? "سجل مؤسستك (مدرسة أو قاعة رياضية) في المنصة"
                : "Register your institution (school or sports hall) on the platform"}
            </p>
          </div>

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-2.5 text-sm text-emerald-100 backdrop-blur-md">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                {locale === "ar"
                  ? "تم التسجيل بنجاح! جارٍ تحويلك إلى صفحة الدخول..."
                  : "Registration successful! Redirecting to login..."}
              </span>
            </div>
          )}

          {error && !success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/15 px-3.5 py-2.5 text-sm text-red-100 backdrop-blur-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-white/90">
                  {locale === "ar" ? "نوع المؤسسة" : "Institution Type"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setServiceType("school")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-[1.5px] px-4 py-4 text-sm font-semibold backdrop-blur-md transition-all ${
                      serviceType === "school"
                        ? "border-emerald-300 bg-emerald-500/25 text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
                        : "border-white/30 bg-white/10 text-white/70 hover:border-white/60 hover:bg-white/15"
                    }`}
                  >
                    <GraduationCap className="h-6 w-6" />
                    {locale === "ar" ? "مدرسة" : "School"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType("sports_hall")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-[1.5px] px-4 py-4 text-sm font-semibold backdrop-blur-md transition-all ${
                      serviceType === "sports_hall"
                        ? "border-emerald-300 bg-emerald-500/25 text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
                        : "border-white/30 bg-white/10 text-white/70 hover:border-white/60 hover:bg-white/15"
                    }`}
                  >
                    <Dumbbell className="h-6 w-6" />
                    {locale === "ar" ? "قاعة رياضية" : "Sports Hall"}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-white/90">
                  {locale === "ar" ? "الاسم الكامل" : "Full Name"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    locale === "ar" ? "أحمد بن علي" : "Ahmed Ben Ali"
                  }
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-white/30 bg-white/15 px-3.5 py-3 text-[15px] text-white placeholder:text-white/50 outline-none transition-all backdrop-blur-md focus:border-accent focus:bg-white/20 focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-white/90">
                  {serviceType === "school"
                    ? locale === "ar"
                      ? "اسم المدرسة"
                      : "School Name"
                    : locale === "ar"
                      ? "اسم القاعة الرياضية"
                      : "Sports Hall Name"}
                </label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder={
                    serviceType === "school"
                      ? locale === "ar"
                        ? "مدرسة الفلاح"
                        : "Al Falah School"
                      : locale === "ar"
                        ? "قاعة الأبطال"
                        : "Champions Hall"
                  }
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-white/30 bg-white/15 px-3.5 py-3 text-[15px] text-white placeholder:text-white/50 outline-none transition-all backdrop-blur-md focus:border-accent focus:bg-white/20 focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="mb-4">
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

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-white/90">
                  {t("password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/30 bg-white/15 px-3.5 py-3 text-[15px] text-white placeholder:text-white/50 outline-none transition-all backdrop-blur-md focus:border-accent focus:bg-white/20 focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-semibold text-white/90">
                  {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={
                    locale === "ar"
                      ? "أعد إدخال كلمة المرور"
                      : "Re-enter password"
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/30 bg-white/15 px-3.5 py-3 text-[15px] text-white placeholder:text-white/50 outline-none transition-all backdrop-blur-md focus:border-accent focus:bg-white/20 focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-[0_6px_28px_rgba(16,185,129,0.65)] disabled:opacity-70"
              >
                {loading
                  ? locale === "ar"
                    ? "جارٍ التسجيل..."
                    : "Registering..."
                  : locale === "ar"
                    ? "إنشاء الحساب"
                    : "Create Account"}
              </button>
            </form>
          )}

          <div className="mt-5 text-center text-[13px] text-white/80">
            {locale === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-emerald-300 hover:underline"
            >
              {locale === "ar" ? "تسجيل الدخول" : "Sign in"}
            </Link>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
