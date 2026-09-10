import Image from "next/image";
import { cn } from "@/lib/utils";

export const LOGO_SRC = "/djo.png";
export const LOGO_WIDTH = 1271;
export const LOGO_HEIGHT = 560;

interface LogoProps {
  className?: string;
  alt?: string;
  priority?: boolean;
}

export function Logo({ className, alt = "DJO", priority = false }: LogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt={alt}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}