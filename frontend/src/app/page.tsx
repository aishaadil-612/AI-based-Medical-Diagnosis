"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Brain,
  Layers,
  Scan,
  LineChart,
  Cpu,
  Eye,
  Monitor,
  BarChart3,
  Target,
  Activity,
  Award,
  Stethoscope,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DisclaimerBanner from "@/components/DisclaimerBanner";

const LungVisualization3D = dynamic(
  () => import("@/components/LungVisualization3D"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-medium">Initializing 3D Anatomy Canvas...</span>
      </div>
    ),
  }
);

// Animation presets
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// Architecture pipeline steps
const pipeline = [
  {
    step: "01",
    icon: Scan,
    title: "Radiograph Ingestion",
    desc: "224×224 RGB standardization with ImageNet zero-centered normalization.",
    tag: "Preprocessing",
  },
  {
    step: "02",
    icon: Brain,
    title: "EfficientNetB0 Backbone",
    desc: "4.05M compound-scaled parameters with MBConv & Squeeze-and-Excitation blocks.",
    tag: "Feature Extraction",
  },
  {
    step: "03",
    icon: Target,
    title: "Classification Head",
    desc: "Global Average Pooling → Dropout(0.2) → Sigmoid activation (τ = 0.50).",
    tag: "Inference",
  },
  {
    step: "04",
    icon: Eye,
    title: "Grad-CAM XAI Engine",
    desc: "Gradient backprop on top_conv (7×7) yielding high-resolution visual heatmaps.",
    tag: "Explainability",
  },
  {
    step: "05",
    icon: Stethoscope,
    title: "Clinical Reasoning",
    desc: "Automated anatomical localization (Hemithorax, Zone) & triage audit trails.",
    tag: "Decision Support",
  },
];

const metrics = [
  { label: "Overall Accuracy", value: "91.36%", detail: "804 / 880 correct hold-out cases" },
  { label: "Diagnostic Precision", value: "98.46%", detail: "575 / 584 true positive classifications" },
  { label: "Sensitivity / Recall", value: "89.56%", detail: "575 / 642 pneumonia cases caught" },
  { label: "Clinical Specificity", value: "96.22%", detail: "229 / 238 healthy controls verified" },
  { label: "F1-Score", value: "0.9380", detail: "Balanced harmonic accuracy mean" },
  { label: "ROC-AUC Metric", value: "0.9873", detail: "Near-perfect discrimination capacity" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 overflow-x-hidden">
        {/* =================================================================
            1. HERO SECTION WITH 3D LUNG VISUALIZER
            ================================================================= */}
        <section className="relative px-6 pt-8 pb-16 max-w-7xl mx-auto">
          <div className="relative z-10 space-y-6">
            <DisclaimerBanner />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
              {/* Left 7 Cols: Value Proposition */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="lg:col-span-7 space-y-6"
              >
                <motion.div variants={fadeUp} className="space-y-3">
                  <div className="relative inline-block">
                    <Image
                      src="/pneumora-brand-full.png"
                      alt="Pneumora"
                      width={440}
                      height={104}
                      className="h-14 sm:h-16 lg:h-20 w-auto object-contain -ml-1 drop-shadow-[0_0_30px_rgba(6,182,212,0.45)]"
                      priority
                    />
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug max-w-xl">
                    AI-Powered Chest Radiograph Pneumonia Screening
                  </h1>
                </motion.div>

                <motion.p
                  variants={fadeUp}
                  className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl"
                >
                  <strong className="text-white">Pneumora</strong> combines transfer learning via fine-tuned <strong className="text-white">EfficientNetB0</strong> with
                  gradient-weighted class activation mapping (<strong className="text-cyan-400">Grad-CAM</strong>).
                  It provides transparent visual accountability, highlights pulmonary consolidations in 3D, and eliminates black-box uncertainty.
                </motion.p>

                {/* Metric Quick-Pills */}
                <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
                    <Award size={14} className="text-emerald-400" />
                    <span><strong className="text-white">91.36%</strong> Test Accuracy</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
                    <LineChart size={14} className="text-cyan-400" />
                    <span><strong className="text-white">0.9873</strong> ROC-AUC</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
                    <Shield size={14} className="text-amber-400" />
                    <span><strong className="text-white">880</strong> Hold-Out Images</span>
                  </div>
                </motion.div>

                {/* Action CTAs */}
                <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/analyze"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all hover:scale-102"
                  >
                    <span>Launch Clinical Analyzer</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/insights"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 text-slate-200 border border-slate-700/80 font-medium text-sm transition-all"
                  >
                    <BarChart3 size={16} className="text-cyan-400" />
                    <span>View Benchmark Metrics</span>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Right 5 Cols: Interactive 3D Lung */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="lg:col-span-5 h-[420px] relative"
              >
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-teal-500/10 blur-xl opacity-60 pointer-events-none" />
                <LungVisualization3D isIdle />
              </motion.div>
            </div>
          </div>
        </section>

        {/* =================================================================
            2. KEY METRICS PERFORMANCE DASHBOARD
            ================================================================= */}
        <section className="px-6 py-12 bg-slate-950/60 border-y border-slate-800/60">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
                  Statistical Rigor
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                  Hold-Out Test Set Performance (N=880)
                </h2>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Evaluated on independent test partitions with exact clinical metrics, confusion matrix auditing, and balanced class re-weighting.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {metrics.map((m, idx) => (
                <div key={idx} className="metric-card">
                  <div className="text-2xl font-extrabold text-cyan-400 font-mono">
                    {m.value}
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mt-1">
                    {m.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {m.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =================================================================
            3. 5-STAGE CLINICAL PIPELINE ARCHITECTURE
            ================================================================= */}
        <section className="px-6 py-16 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
              System Workflow
            </span>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              The Pneumora Deep Learning & XAI Architecture
            </h2>
            <p className="text-sm text-slate-400">
              Every radiograph traverses a verified, calibrated pipeline from raw pixel preprocessing to explainable anatomical reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {pipeline.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="glass-card p-5 relative flex flex-col justify-between group hover:border-cyan-500/30"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                        <Icon size={20} />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {p.step}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold tracking-wider uppercase text-cyan-400/90 block mb-1">
                      {p.tag}
                    </span>
                    <h3 className="text-sm font-bold text-white mb-2">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 size={12} />
                      Verified
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =================================================================
            4. WHY EXPLAINABLE AI MATTERS IN HEALTHCARE
            ================================================================= */}
        <section className="px-6 py-16 bg-slate-950/70 border-t border-slate-800/60">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-semibold tracking-wider uppercase text-rose-400">
                Clinical Trust & Interpretability
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Why Pneumora Prioritizes Explainability Over Black-Box Predictions
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Pneumonia is responsible for over 2.5 million deaths annually. While deep learning models achieve high accuracy on benchmark datasets, standard models are notorious for <strong className="text-white">shortcut learning</strong> — inadvertently basing decisions on hospital tags, portable X-ray markers, or peripheral text tokens rather than true alveolar consolidations.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Pneumora integrates <strong className="text-cyan-400">Grad-CAM explainability</strong> to compute spatial gradients directly at the final convolutional feature layer. This empowers physicians to visually verify that model attention is grounded within pulmonary parenchyma before trusting a diagnostic recommendation.
              </p>

              <div className="pt-2">
                <Link
                  href="/analyze"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>Test a benchmark case in the analyzer</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5 space-y-2">
                <Shield size={22} className="text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Shortcut Learning Detection</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Flags upper-corner text tokens (e.g. &apos;PORTABLE&apos; or &apos;SUPINE&apos;) to warn physicians when artifacts influence attention.
                </p>
              </div>

              <div className="glass-card p-5 space-y-2">
                <Target size={22} className="text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Anatomical Zoning</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Classifies primary activation clusters by hemithorax (Right/Left) and zone (Upper, Mid, Lower).
                </p>
              </div>

              <div className="glass-card p-5 space-y-2">
                <Activity size={22} className="text-amber-400" />
                <h4 className="text-sm font-bold text-white">Borderline Triage Protocol</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Provides clinical confidence safety alerts whenever predicted probabilities fall near the 0.50 decision boundary.
                </p>
              </div>

              <div className="glass-card p-5 space-y-2">
                <Layers size={22} className="text-rose-400" />
                <h4 className="text-sm font-bold text-white">3D Thoracic Twin</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Projects 2D radiograph saliency into interactive 3D anatomical space with real-time lesion beacons.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
