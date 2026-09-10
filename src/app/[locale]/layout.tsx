import type { Metadata } from "next";
import { Cairo, Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AuthWrapper } from "@/components/layout/AuthWrapper";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "../globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "منصة إدارة المدارس — School Management Platform",
  description: "حل متكامل لإدارة المؤسسات التعليمية الخاصة",
  icons: { icon: "/favicon.png", apple: "/apple-icon.png" },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const isRTL = locale === "ar";

  return (
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"} data-scroll-behavior="smooth" className={`${cairo.variable} ${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider><AuthWrapper>{children}</AuthWrapper></ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
