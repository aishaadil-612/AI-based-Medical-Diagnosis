"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Scan,
  LineChart,
  Asterisk,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const navTabs = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Clinical Analyzer", href: "/analyze", icon: Scan },
  { label: "Model Insights", href: "/insights", icon: LineChart },
];

export default function Navbar() {
  const pathname = usePathname();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => {
        if (res.ok) setBackendOnline(true);
        else setBackendOnline(false);
      })
      .catch(() => setBackendOnline(false));
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#070b14]/90 backdrop-blur-2xl transition-all">
      <div className="flex items-center justify-between h-20 px-6 sm:px-10 max-w-[1600px] mx-auto">
        
        {/* Left: Brand Identity (Text only, no logo) */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-xl font-extrabold tracking-tight text-white font-sans group-hover:text-cyan-300 transition-colors">
            Pneumora
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            XAI
          </span>
          <span className="text-xs text-slate-400 font-medium hidden lg:inline border-l border-white/10 pl-2.5">
            Explainable Pneumonia Detection
          </span>
        </Link>

        {/* Center: The Single Canonical Nav Bar */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-full border border-white/[0.08] shadow-inner">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`clinora-nav-pill ${isActive ? "active" : ""}`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Real-time Backend Engine Status & Quick Action */}
        <div className="flex items-center gap-3.5">
          {/* Real-time ML Server Health Status */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs border backdrop-blur-md transition-colors ${
              backendOnline === true
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                : backendOnline === false
                ? "bg-rose-950/40 text-rose-300 border-rose-500/30"
                : "bg-slate-900 text-slate-400 border-white/[0.06]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? "bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse"
                  : backendOnline === false
                  ? "bg-rose-400"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-[11px] font-semibold tracking-wide">
              {backendOnline === true
                ? "EfficientNetB0 Active"
                : backendOnline === false
                ? "API Offline"
                : "Checking Model..."}
            </span>
          </div>

          {/* Action CTA Button */}
          {pathname !== "/analyze" && (
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all hover:scale-105"
            >
              <Sparkles size={13} />
              <span>Launch Analyzer</span>
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
