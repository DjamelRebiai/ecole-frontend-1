"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import {
  GraduationCap,
  ClipboardList,
  CalendarClock,
  Wallet,
  BedDouble,
  CheckSquare,
  ShieldCheck,
  Shield,
  Lock,
  Server,
  Database,
  Plug,
  Languages,
  Check,
  X,
  ArrowDown,
} from "lucide-react";
import "./slide-deck.css";

import type { LucideIcon } from "lucide-react";

const kpis = [
  { start: 0, end: 24, prefix: "", suffix: "", labelKey: "kpi_1", trendKey: "kpi_1_trend", color: "var(--deck-accent)" },
  { start: 0, end: 2847, prefix: "", suffix: "", labelKey: "kpi_2", trendKey: "kpi_2_trend", color: "var(--deck-green)" },
  { start: 0, end: 124, prefix: "", suffix: "", labelKey: "kpi_3", trendKey: "kpi_3_trend", color: "var(--deck-blue)" },
  { start: 0, end: 38.4, prefix: "$", suffix: "K", labelKey: "kpi_4", trendKey: "kpi_4_trend", color: "var(--deck-accent)" },
];

const features = [
  { icon: GraduationCap, titleKey: "feat_1_title", descKey: "feat_1_desc" },
  { icon: ClipboardList, titleKey: "feat_2_title", descKey: "feat_2_desc" },
  { icon: CalendarClock, titleKey: "feat_3_title", descKey: "feat_3_desc" },
  { icon: Wallet, titleKey: "feat_4_title", descKey: "feat_4_desc" },
  { icon: BedDouble, titleKey: "feat_5_title", descKey: "feat_5_desc" },
  { icon: CheckSquare, titleKey: "feat_6_title", descKey: "feat_6_desc" },
];

const cred = [
  { icon: Shield, titleKey: "cred_1_title", descKey: "cred_1_desc" },
  { icon: Lock, titleKey: "cred_2_title", descKey: "cred_2_desc" },
  { icon: Server, titleKey: "cred_3_title", descKey: "cred_3_desc" },
  { icon: Database, titleKey: "cred_4_title", descKey: "cred_4_desc" },
  { icon: Plug, titleKey: "cred_5_title", descKey: "cred_5_desc" },
  { icon: Languages, titleKey: "cred_6_title", descKey: "cred_6_desc" },
];

const trustItems = ["trust_1", "trust_2", "trust_3", "trust_4"];

const plans = [
  { nameKey: "pricing_1_name", studentsKey: "pricing_1_students", priceKey: "pricing_1_price", periodKey: "pricing_1_period", featKeys: ["pricing_1_feat_1", "pricing_1_feat_2", "pricing_1_feat_3"], featured: false, tagKey: null },
  { nameKey: "pricing_2_name", studentsKey: "pricing_2_students", priceKey: "pricing_2_price", periodKey: "pricing_2_period", featKeys: ["pricing_2_feat_1", "pricing_2_feat_2", "pricing_2_feat_3"], featured: true, tagKey: "pricing_2_tag" },
  { nameKey: "pricing_3_name", studentsKey: "pricing_3_students", priceKey: "pricing_3_price", periodKey: "pricing_3_period", featKeys: ["pricing_3_feat_1", "pricing_3_feat_2", "pricing_3_feat_3", "pricing_3_feat_4"], featured: false, tagKey: null },
];

const compareRows = [1, 2, 3, 4, 5, 6].map((n) => ({
  featureKey: `compare_row_${n}`,
  tradKey: `compare_trad_${n}`,
  ecoleKey: `compare_ecole_${n}`,
}));

function CountUp({
  end,
  prefix = "",
  suffix = "",
  decimals = 0,
  active,
  locale,
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  active: boolean;
  locale: string;
}) {
  const [value, setValue] = useState(0);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const animate = active && !reduced;

  useEffect(() => {
    if (!animate) return;
    const duration = 1400;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(end * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, end]);

  const shown = animate ? value : end;

  return (
    <span>
      {prefix}
      {shown.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export default function SlideDeck() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const pathname = usePathname();
  const deckRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const total = 14;

  useEffect(() => {
    const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
    const initial = prefersLight ? "light" : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-deck-theme", initial);
    document.body.style.background = "var(--deck-bg)";
    document.body.style.color = "var(--deck-text)";
    return () => {
      document.documentElement.removeAttribute("data-deck-theme");
      document.body.style.background = "";
      document.body.style.color = "";
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-deck-theme", next);
      return next;
    });
  }, []);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const slides = deck.querySelectorAll<HTMLElement>(".slide");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            const idx = Array.from(slides).indexOf(entry.target as HTMLElement);
            setCurrent(idx);
            if (history.replaceState) history.replaceState(null, "", `#/${idx + 1}`);
          }
        });
      },
      { threshold: 0.5 }
    );
    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const slides = deck.querySelectorAll<HTMLElement>(".slide");
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (["ArrowDown", "ArrowRight", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        slides[Math.min(current + 1, total - 1)]?.scrollIntoView({ behavior: "smooth" });
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        slides[Math.max(current - 1, 0)]?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "Home") { e.preventDefault(); slides[0]?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "End") { e.preventDefault(); slides[total - 1]?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "t" || e.key === "T") { toggleTheme(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [current, toggleTheme, total]);

  useEffect(() => {
    const m = location.hash.match(/^#\/(\d+)$/);
    if (m) {
      const i = parseInt(m[1], 10) - 1;
      if (i >= 0 && i < total) {
        setTimeout(() => {
          deckRef.current?.querySelectorAll<HTMLElement>(".slide")[i]?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
        }, 100);
      }
    }
  }, [total]);

  const goTo = useCallback((i: number) => {
    deckRef.current?.querySelectorAll<HTMLElement>(".slide")[Math.max(0, Math.min(i, total - 1))]?.scrollIntoView({ behavior: "smooth" });
  }, [total]);

  const otherLocale = locale === "en" ? "ar" : "en";
  const otherLabel = locale === "en" ? "AR" : "عر";

  return (
    <>
      {/* Animated glass background */}
      <div className="deck-bg" aria-hidden="true">
        <div className="deck-blob deck-blob--1" />
        <div className="deck-blob deck-blob--2" />
        <div className="deck-blob deck-blob--3" />
        <div className="deck-blob deck-blob--4" />
      </div>

      <div className="deck-progress" style={{ width: `${((current + 1) / total) * 100}%` }} />
      <div className="deck-dots">
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} className={`deck-dot ${i === current ? "active" : ""}`} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
      <div className="deck-counter">{current + 1} / {total}</div>
      <button className="deck-theme-btn" onClick={toggleTheme}>◐ {theme}</button>
      <Link href={pathname} locale={otherLocale} className="deck-lang-btn">{otherLabel}</Link>
      <div className="deck-hints">← → space to navigate · T theme</div>

      <div className="deck" ref={deckRef}>

        {/* ===== SLIDE 1: TITLE ===== */}
        <section className="slide slide--title">
          <svg className="slide__decor" style={{ top: 0, right: 0 }} width="120" height="120" viewBox="0 0 120 120">
            <line x1="120" y1="0" x2="120" y2="40" stroke="var(--deck-accent)" strokeWidth="2" opacity="0.15" />
            <line x1="80" y1="0" x2="120" y2="0" stroke="var(--deck-accent)" strokeWidth="2" opacity="0.15" />
          </svg>
          <svg className="slide__decor" style={{ bottom: 0, left: 0 }} width="120" height="120" viewBox="0 0 120 120">
            <line x1="0" y1="80" x2="0" y2="120" stroke="var(--deck-accent)" strokeWidth="2" opacity="0.15" />
            <line x1="0" y1="120" x2="40" y2="120" stroke="var(--deck-accent)" strokeWidth="2" opacity="0.15" />
          </svg>
          <div className="reveal-item">
            <p className="slide__subtitle" style={{ marginBottom: "clamp(16px,2vh,32px)" }}>{t("badge")}</p>
          </div>
          <h1 className="slide__display reveal-item">{t("title")}</h1>
          <div className="reveal-item">
            <p className="slide__subtitle" style={{ marginTop: "clamp(16px,2vh,32px)", maxWidth: 640 }}>{t("subtitle")}</p>
          </div>
          <div className="reveal-item" style={{ marginTop: "clamp(24px,4vh,48px)", display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/auth/register" className="deck-cta deck-cta--primary">{t("cta_start")} →</Link>
            <button onClick={() => goTo(8)} className="deck-cta deck-cta--outline">{t("cta_demo")}</button>
          </div>
          <div className="slide__trust reveal-item">
            {trustItems.map((key, i) => (
              <div key={i} className="slide__trust-item">
                <ShieldCheck size={16} strokeWidth={2} />
                <span>{t(key)}</span>
              </div>
            ))}
          </div>
          <div className="slide__scroll-hint reveal-item" aria-hidden="true">
            <span>{t("scroll_hint")}</span>
            <ArrowDown size={16} strokeWidth={2} />
          </div>
        </section>

        {/* ===== SLIDE 2: TOC ===== */}
        <section className="slide slide--toc">
          <p className="slide__label reveal-item">{t("toc_label")}</p>
          <h2 className="slide__heading reveal-item">{t("toc_title")}</h2>
          <ol className="slide__toc">
            <li className="reveal-item"><span className="slide__toc-num">01</span> {t("toc_1")} <span className="slide__toc-hint">{t("toc_hint_1")}</span></li>
            <li className="reveal-item"><span className="slide__toc-num">02</span> {t("toc_2")} <span className="slide__toc-hint">{t("toc_hint_2")}</span></li>
            <li className="reveal-item"><span className="slide__toc-num">03</span> {t("toc_3")} <span className="slide__toc-hint">{t("toc_hint_3")}</span></li>
            <li className="reveal-item"><span className="slide__toc-num">04</span> {t("toc_4")} <span className="slide__toc-hint">{t("toc_hint_4")}</span></li>
            <li className="reveal-item"><span className="slide__toc-num">05</span> {t("toc_5")} <span className="slide__toc-hint">{t("toc_hint_5")}</span></li>
          </ol>
        </section>

        {/* ===== SLIDE 3: DIVIDER — THE NUMBERS ===== */}
        <section className="slide slide--divider">
          <span className="slide__number">01</span>
          <div>
            <h2 className="slide__heading reveal-item">{t("divider_1")}</h2>
            <p className="slide__subtitle reveal-item" style={{ marginTop: 12 }}>{t("divider_1_sub")}</p>
          </div>
        </section>

        {/* ===== SLIDE 4: DASHBOARD / KPI ===== */}
        <section className="slide slide--dashboard">
          <p className="slide__label reveal-item">01 · {t("kpi_label")}</p>
          <h2 className="slide__heading reveal-item" style={{ marginBottom: "clamp(12px,2vh,28px)" }}>{t("kpi_title")}</h2>
          <div className="slide__kpis">
            {kpis.map((k, i) => (
              <div key={i} className="slide__kpi reveal-item">
                <div className="slide__kpi-val" style={{ color: k.color }}>
                  <CountUp active={current === 3} end={k.end} prefix={k.prefix} suffix={k.suffix} locale={locale} />
                </div>
                <div className="slide__kpi-label">{t(k.labelKey)}</div>
                <div className="slide__kpi-trend" style={{ color: "var(--deck-green)" }}>{t(k.trendKey)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== SLIDE 5: DIVIDER — THE SOLUTION ===== */}
        <section className="slide slide--divider">
          <span className="slide__number">02</span>
          <div>
            <h2 className="slide__heading reveal-item">{t("divider_2")}</h2>
            <p className="slide__subtitle reveal-item" style={{ marginTop: 12 }}>{t("divider_2_sub")}</p>
          </div>
        </section>

        {/* ===== SLIDE 6: SPLIT — BEFORE vs AFTER ===== */}
        <section className="slide slide--split">
          <div className="slide__panels">
            <div className="slide__panel slide__panel--primary">
              <p className="slide__label reveal-item" style={{ color: "var(--deck-red)" }}>{t("split_before_label")}</p>
              <h2 className="slide__heading reveal-item" style={{ fontSize: "clamp(22px,3.5vw,36px)" }}>{t("split_before_title")}</h2>
              <ul className="slide__bullets" style={{ marginTop: 16 }}>
                <li className="reveal-item">{t("split_before_1")}</li>
                <li className="reveal-item">{t("split_before_2")}</li>
                <li className="reveal-item">{t("split_before_3")}</li>
                <li className="reveal-item">{t("split_before_4")}</li>
              </ul>
            </div>
            <div className="slide__panel slide__panel--secondary">
              <p className="slide__label reveal-item" style={{ color: "var(--deck-green)" }}>{t("split_after_label")}</p>
              <h2 className="slide__heading reveal-item" style={{ fontSize: "clamp(22px,3.5vw,36px)" }}>{t("split_after_title")}</h2>
              <ul className="slide__bullets" style={{ marginTop: 16 }}>
                <li className="reveal-item">{t("split_after_1")}</li>
                <li className="reveal-item">{t("split_after_2")}</li>
                <li className="reveal-item">{t("split_after_3")}</li>
                <li className="reveal-item">{t("split_after_4")}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ===== SLIDE 7: DIVIDER — THE MODULES ===== */}
        <section className="slide slide--divider">
          <span className="slide__number">03</span>
          <div>
            <h2 className="slide__heading reveal-item">{t("divider_3")}</h2>
            <p className="slide__subtitle reveal-item" style={{ marginTop: 12 }}>{t("divider_3_sub")}</p>
          </div>
        </section>

        {/* ===== SLIDE 8: FEATURES GRID ===== */}
        <section className="slide slide--features">
          <h2 className="slide__heading reveal-item">{t("features_title")}</h2>
          <div className="slide__features">
            {features.map((f, i) => {
              const Icon = f.icon as LucideIcon;
              return (
                <div key={i} className="slide__feature reveal-item">
                  <div className="slide__feature-icon">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="slide__feature-title">{t(f.titleKey)}</div>
                  <div className="slide__feature-desc">{t(f.descKey)}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== SLIDE 9: COMPARISON TABLE ===== */}
        <section className="slide slide--compare">
          <div className="slide__inner-col">
            <p className="slide__label reveal-item">04 · {t("compare_label")}</p>
            <h2 className="slide__heading reveal-item">{t("compare_title")}</h2>
            <div className="compare-scroll reveal-item">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th scope="col">{t("compare_col_feature")}</th>
                    <th scope="col" className="compare-table__vo">{t("compare_col_traditional")}</th>
                    <th scope="col" className="compare-table__hero">{t("compare_col_ecole")}</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row, i) => (
                    <tr key={i}>
                      <th scope="row">{t(row.featureKey)}</th>
                      <td className="no"><span className="compare-table__cell"><X size={14} strokeWidth={2} /><span>{t(row.tradKey)}</span></span></td>
                      <td className="yes"><span className="compare-table__cell"><Check size={14} strokeWidth={2} /><span>{t(row.ecoleKey)}</span></span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="compare-table__cta">
                    <td></td>
                    <td className="no"></td>
                    <td className="compare-table__cta-cell">
                      <Link href="/auth/register" className="deck-cta--compare">{t("cta_start")} →</Link>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* ===== SLIDE 10: CHART ===== */}
        <section className="slide slide--chart">
          <h2 className="slide__heading reveal-item">{t("chart_title")}</h2>
          <div className="chart-wrap reveal-item">
            <div className="bar-chart" aria-label={t("chart_title")}>
              <div className="bar-chart__col"><span className="bar-chart__val">$0</span><div className="bar-chart__bar bar-chart__bar--ghost" style={{ height: "4%" }}></div></div>
              <div className="bar-chart__col"><span className="bar-chart__val">$120K</span><div className="bar-chart__bar" style={{ height: "22%" }}></div></div>
              <div className="bar-chart__col"><span className="bar-chart__val">$240K</span><div className="bar-chart__bar" style={{ height: "40%" }}></div></div>
              <div className="bar-chart__col"><span className="bar-chart__val">$350K</span><div className="bar-chart__bar" style={{ height: "58%" }}></div></div>
              <div className="bar-chart__col"><span className="bar-chart__val">$460K</span><div className="bar-chart__bar" style={{ height: "76%" }}></div></div>
              <div className="bar-chart__col"><span className="bar-chart__val">$1.2M+</span><div className="bar-chart__bar" style={{ height: "95%" }}></div></div>
            </div>
            <div className="bar-chart__labels">
              <span>{t("chart_label_1")}</span><span>{t("chart_label_2")}</span><span>{t("chart_label_3")}</span><span>{t("chart_label_4")}</span><span>{t("chart_label_5")}</span><span>{t("chart_label_6")}</span>
            </div>
          </div>
          <p className="slide__subtitle reveal-item" style={{ marginTop: "clamp(8px,1.5vh,16px)" }}>{t("chart_subtitle")}</p>
        </section>

        {/* ===== SLIDE 12: CREDIBILITY / TRUST ===== */}
        <section className="slide slide--cred">
          <p className="slide__label reveal-item">05 · {t("cred_label")}</p>
          <h2 className="slide__heading reveal-item" style={{ marginBottom: "clamp(12px,2vh,24px)" }}>{t("cred_title")}</h2>
          <div className="slide__cred">
            {cred.map((c, i) => {
              const Icon = c.icon as LucideIcon;
              return (
                <div key={i} className="slide__cred-card reveal-item">
                  <div className="slide__feature-icon">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="slide__feature-title">{t(c.titleKey)}</div>
                  <div className="slide__feature-desc">{t(c.descKey)}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== SLIDE 13: PRICING ===== */}
        <section className="slide slide--pricing">
          <div className="slide__inner-col">
            <p className="slide__label reveal-item">06 · {t("pricing_label")}</p>
            <h2 className="slide__heading reveal-item">{t("pricing_title")}</h2>
            <p className="slide__subtitle reveal-item" style={{ marginTop: 8, marginBottom: "clamp(12px,2vh,24px)", textTransform: "none", letterSpacing: 0.5 }}>{t("pricing_sub")}</p>
            <div className="slide__plans">
              {plans.map((p, i) => (
                <div key={i} className={`slide__plan reveal-item ${p.featured ? "slide__plan--featured" : ""}`}>
                  <div className="slide__plan-head">
                    <div className={`slide__plan-name ${p.featured ? "slide__plan-name--featured" : ""}`}>{t(p.nameKey)}</div>
                    {p.tagKey && <span className="slide__plan-tag">{t(p.tagKey)}</span>}
                  </div>
                  <div className="slide__plan-price">{t(p.priceKey)}</div>
                  <div className="slide__plan-students">{t(p.studentsKey)}</div>
                  <div className="slide__plan-period">{t(p.periodKey)}</div>
                  <ul className="slide__plan-feats">
                    {p.featKeys.map((fk, j) => (
                      <li key={j}><Check size={14} strokeWidth={2} />{t(fk)}</li>
                    ))}
                  </ul>
                  <Link href="/auth/register" className={`deck-cta ${p.featured ? "deck-cta--primary" : "deck-cta--outline"} slide__plan-cta`}>{t("cta_start")} →</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SLIDE 14: FAQ ===== */}
        <section className="slide slide--faq">
          <div className="slide__inner-col slide__inner-col--wide">
            <p className="slide__label reveal-item">07 · {t("faq_label")}</p>
            <h2 className="slide__heading reveal-item" style={{ marginBottom: "clamp(12px,2vh,24px)" }}>{t("faq_title")}</h2>
            <div className="slide__faq">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <details key={n} className="slide__faq-item reveal-item">
                  <summary>{t(`faq_${n}_q`)}</summary>
                  <p>{t(`faq_${n}_a`)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SLIDE 15: FULL-BLEED CTA ===== */}
        <section className="slide slide--bleed">
          <div className="slide__bg--gradient" />
          <div className="slide__scrim" />
          <div className="slide__content">
            <p className="slide__label reveal-item" style={{ color: "rgba(255,255,255,0.6)" }}>08 · {t("bleed_label")}</p>
            <h2 className="slide__heading reveal-item">{t("bleed_title")}</h2>
            <p className="slide__subtitle reveal-item" style={{ color: "rgba(255,255,255,0.6)", marginTop: 12 }}>{t("bleed_subtitle")}</p>
            <div className="reveal-item" style={{ marginTop: "clamp(24px,4vh,48px)", display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input type="email" placeholder={t("bleed_placeholder")}
                style={{
                  flex: 1, minWidth: 220, padding: "14px 20px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px) saturate(140%)",
                  WebkitBackdropFilter: "blur(12px) saturate(140%)",
                  color: "#fff", fontSize: 15, outline: "none",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                  transition: "all 0.25s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(212, 167, 58, 0.5)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(212, 167, 58, 0.12), inset 0 1px 0 rgba(255,255,255,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.18)";
                  e.target.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.1)";
                }}
              />
              <Link href="/auth/register" className="deck-cta deck-cta--primary">{t("bleed_register")} →</Link>
            </div>
            <p className="slide__subtitle reveal-item" style={{ color: "rgba(255,255,255,0.4)", marginTop: 12, fontSize: 12 }}>
              {t("bleed_note")} · <ShieldCheck size={12} strokeWidth={2} style={{ verticalAlign: -2 }} /> {t("bleed_trust")}
            </p>
          </div>
        </section>

      </div>
    </>
  );
}
