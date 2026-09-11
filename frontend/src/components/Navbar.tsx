"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, User } from "lucide-react";
import PneumoraLogo from "./PneumoraLogo";

const navTabs = [
  { label: "Overview", href: "/" },
  { label: "Analyze", href: "/analyze" },
  { label: "Model Insights", href: "/insights" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#010057]/90 backdrop-blur-xl">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo + Wordmark */}
        <Link href="/" className="flex items-center gap-3 group">
          <PneumoraLogo size={34} />
          <span className="text-xl font-bold tracking-tight gradient-text">
            Pneumora
          </span>
        </Link>

        {/* Pill Tabs */}
        <nav className="hidden md:flex items-center gap-2">
          {navTabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`pill-tab ${isActive ? "active" : ""}`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--cyan)] hover:bg-white/5 transition-all"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <button
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--cyan)] hover:bg-white/5 transition-all relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--cyan)] rounded-full" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--cyan)] to-[var(--teal)] flex items-center justify-center text-[var(--navy)] font-bold text-sm">
            P
          </div>
        </div>
      </div>
    </header>
  );
}
