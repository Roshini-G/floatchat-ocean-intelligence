"use client";

import Link from "next/link";
import { useRef, useState } from "react";

interface Props {
  href: string;
  children: React.ReactNode;
}

// Subtle magnetic pull toward the cursor, clamped to a small radius so it
// reads as a premium micro-interaction rather than a gimmick.
export default function MagneticButton({ href, children }: Props) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: relX * 0.25, y: relY * 0.25 });
  }

  function handleMouseLeave() {
    setOffset({ x: 0, y: 0 });
  }

  return (
    <span className="relative inline-block">
      <span className="absolute inset-0 -z-10 animate-pulse rounded-full bg-cyan-400/30 blur-2xl" />
      <Link
        ref={ref}
        href={href}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(45,212,191,0.35)] transition-transform duration-150 ease-out will-change-transform"
      >
        {children}
      </Link>
    </span>
  );
}
