"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ScanLine,
  BrainCircuit,
  BarChart3,
  HelpCircle,
} from "lucide-react";

const sidebarItems = [
  { icon: Home, label: "Overview", href: "/" },
  { icon: ScanLine, label: "Clinical Analyzer", href: "/analyze" },
  { icon: BrainCircuit, label: "Model Architecture", href: "/insights" },
  { icon: BarChart3, label: "Hold-Out Metrics", href: "/insights#metrics" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-16 hidden md:flex flex-col items-center py-5 gap-2 z-40 bg-slate-950/80 border-r border-slate-800/80 backdrop-blur-xl">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href.split("#")[0]));

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group ${
              isActive
                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
            aria-label={item.label}
          >
            <Icon size={18} />

            {/* Hover Tooltip */}
            <span className="absolute left-14 bg-slate-900 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-800 shadow-xl z-50">
              {item.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
