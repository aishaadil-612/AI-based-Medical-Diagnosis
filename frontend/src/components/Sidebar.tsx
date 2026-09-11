"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ScanLine,
  History,
  BrainCircuit,
  Info,
} from "lucide-react";

const sidebarItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: ScanLine, label: "Analyze", href: "/analyze" },
  { icon: History, label: "History", href: "#" },
  { icon: BrainCircuit, label: "Model Insights", href: "/insights" },
  { icon: Info, label: "About", href: "#" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="icon-rail fixed left-0 top-16 bottom-0 w-16 flex flex-col items-center py-6 gap-3 z-40">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : item.href !== "#" && pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`icon-rail-item group relative ${isActive ? "active" : ""}`}
            title={item.label}
          >
            <Icon size={20} />
            {/* Tooltip */}
            <span className="absolute left-14 bg-[var(--navy-light)] text-[var(--text-primary)] text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-[var(--glass-border)]">
              {item.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
