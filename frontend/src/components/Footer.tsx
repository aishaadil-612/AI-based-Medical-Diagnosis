import { Code2, ExternalLink } from "lucide-react";
import PneumoraLogo from "./PneumoraLogo";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <PneumoraLogo size={28} />
            <span className="font-bold text-white tracking-tight">Pneumora</span>
            <span className="text-slate-400 text-sm hidden sm:inline">
              v1.0 — AI-Powered Pneumonia Screening
            </span>
          </div>

          {/* Credit */}
          <p className="text-[var(--text-muted)] text-sm text-center">
            Engineering Major Project — AI-Based Medical Diagnosis with
            Explainable AI (Grad-CAM)
          </p>

          {/* Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/aishaadil-612/AI-based-Medical-Diagnosis"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--cyan)] transition-colors text-sm"
            >
              <Code2 size={16} />
              GitHub
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
