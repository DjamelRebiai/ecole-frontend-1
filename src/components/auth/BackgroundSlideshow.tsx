"use client";

import Image from "next/image";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

interface BackgroundSlideshowProps {
  images: string[];
  intervalMs?: number;
  transitionMs?: number;
  className?: string;
  showOverlay?: boolean;
  overlayClassName?: string;
  minScale?: number;
  maxScale?: number;
}

function buildKenBurnsDef(index: number, minScale: number, maxScale: number) {
  const scale = minScale + Math.random() * (maxScale - minScale);
  const angle = Math.random() * Math.PI * 2;
  const distance = 1.5 + Math.random() * 2.5;
  return {
    toScale: scale.toFixed(3),
    tx: (Math.cos(angle) * distance).toFixed(2),
    ty: (Math.sin(angle) * distance).toFixed(2),
  };
}

export function BackgroundSlideshow({
  images,
  intervalMs = 6000,
  transitionMs = 1800,
  className,
  showOverlay = true,
  overlayClassName,
  minScale = 1.06,
  maxScale = 1.13,
}: BackgroundSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const nextIndex = useMemo(
    () => (currentIndex + 1) % images.length,
    [currentIndex, images.length]
  );

  const keyframesCss = useMemo(() => {
    return images
      .map((_, i) => {
        const d = buildKenBurnsDef(i, minScale, maxScale);
        return `@keyframes djo-kenburns-${i} {
  from { transform: scale(1) translate(0, 0); }
  to { transform: scale(${d.toScale}) translate(${d.tx}px, ${d.ty}px); }
}`;
      })
      .join("\n");
  }, [images, minScale, maxScale]);

  const advanceSlide = useCallback(() => {
    setIsTransitioning(true);

    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % images.length);
      setIsTransitioning(false);
    }, transitionMs / 2);
  }, [transitionMs, images.length]);

  useEffect(() => {
    intervalRef.current = setInterval(advanceSlide, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, [advanceSlide, intervalMs]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <style>{keyframesCss}</style>

      {images.map((src, i) => {
        const isIncoming = i === nextIndex && isTransitioning;
        const isAnimating = i === currentIndex || isIncoming;
        const visible = i === currentIndex || isIncoming;

        return (
          <div
            key={src}
            className="absolute inset-0"
            style={{
              opacity: visible ? 1 : 0,
              transition: `opacity ${transitionMs}ms ease, transform ${transitionMs}ms ease-in-out`,
              ...(isAnimating
                ? { animation: `djo-kenburns-${i} ${intervalMs}ms linear forwards` }
                : {}),
            }}
            aria-hidden="true"
          >
            <Image
              src={src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
              style={{
                filter: "brightness(0.85) saturate(1.1)",
              }}
            />
          </div>
        );
      })}

      {showOverlay && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70",
            "transition-opacity duration-700",
            overlayClassName
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function LoginBackgroundSlideshow() {
  const images = [
    "/djo-backend-1.png",
    "/djo-backend-2.png",
    "/djo-backend-3.png",
  ];

  return <BackgroundSlideshow images={images} intervalMs={7000} transitionMs={2000} />;
}