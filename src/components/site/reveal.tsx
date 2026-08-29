"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Wrapper d'animation au scroll (fade + slide-up).
 * Implémenté avec IntersectionObserver + CSS - sans framer-motion.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animationDelay = `${delay}s`;
          el.classList.add("reveal-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "-60px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={cn("reveal-hidden", className)}>
      {children}
    </div>
  );
}
