"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Eye,
  Layers,
  BarChart3,
  Stethoscope,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  Scan,
  Flame,
  ChevronRight,
  TrendingUp,
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
      <div className="w-full h-[420px] rounded-3xl bg-slate-900/60 border border-white/[0.08] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-slate-300">Loading 3D Anatomy Model...</span>
      </div>
    ),
  }
);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PredictionResult {
  prob: number;
  pred_label: string;
  pred_idx: number;
  confidence: number;
  hemithorax: string;
  zone: string;
  y_peak: number;
  x_peak: number;
  salient_pct: number;
  diag_reason: string;
  saliency_reason: string;
  triage_reason: string;
  ground_truth?: string;
  images: {
    original: string;
    heatmap: string;
    overlay: string;
  };
}

const samples = [
  { key: "normal_1", name: "Sample 1: Normal Chest Radiograph", label: "NORMAL", desc: "Clear bilateral lung parenchyma without infiltrates" },
  { key: "normal_2", name: "Sample 2: Normal Chest Radiograph", label: "NORMAL", desc: "Physiological radiolucency with clear costophrenic angles" },
  { key: "pneumonia_bacterial", name: "Sample 3: Bacterial Pneumonia", label: "PNEUMONIA", desc: "Dense focal lobar consolidation and bronchovascular markings" },
  { key: "pneumonia_viral", name: "Sample 4: Viral Pneumonia", label: "PNEUMONIA", desc: "Bilateral interstitial reticular / perihilar opacity pattern" },
  { key: "challenging_fn", name: "Sample 5: Challenging Borderline Case", label: "PNEUMONIA", desc: "Subtle basilar opacity near threshold boundary" },
];


export default function AnalyzePage() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeImageView, setActiveImageView] = useState<"triplet" | "overlay">("triplet");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePredict = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Server error: ${res.status}`);
      }
      const data: PredictionResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSamplePredict = useCallback(async (sampleKey: string) => {
    setLoading(true);
    setError(null);
    setFileName(samples.find((s) => s.key === sampleKey)?.name || sampleKey);
    try {
      const res = await fetch(
        `${API_BASE}/api/predict-sample?sample_key=${sampleKey}`,
        { method: "POST" }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Server error: ${res.status}`);
      }
      const data: PredictionResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze sample");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
        handlePredict(file);
      }
    },
    [handlePredict]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handlePredict(file);
    },
    [handlePredict]
  );

  const handleReset = () => {
    setResult(null);
    setError(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isPneumonia = result?.pred_label === "PNEUMONIA";

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14]">
      <Navbar />

      <div className="flex flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-6">
        {/* Main Content Area */}
        <main className="w-full space-y-6">
          <DisclaimerBanner />

          {/* =================================================================
              DRIBBLE-STYLE GREETING HEADER: "Hey, Clinician"
              ================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Hey, Clinician
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                Lets Monitor Your Lung System Analysis
              </p>
            </div>

            {result && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/[0.08] text-xs font-semibold shadow-md transition-all hover:scale-105 self-start sm:self-auto"
              >
                <RotateCcw size={13} />
                <span>New Radiograph Scan</span>
              </button>
            )}
          </div>

          {/* =================================================================
              INTAKE SCREEN (when no scan loaded)
              ================================================================= */}
          {!result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Drag & Drop Upload Zone */}
                <div
                  className={`lg:col-span-6 clinora-card p-10 flex flex-col items-center justify-center min-h-[340px] cursor-pointer hover:border-cyan-500/30 transition-all ${
                    dragOver ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_40px_rgba(6,182,212,0.2)]" : ""
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-teal-400/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
                    <Upload size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Upload Patient Radiograph
                  </h3>
                  <p className="text-xs text-slate-400 mb-5 text-center max-w-sm leading-relaxed">
                    Drag and drop DICOM export or chest X-ray image (AP/PA View) to execute real-time Grad-CAM explainability
                  </p>
                  <span className="px-4 py-1.5 rounded-full bg-slate-900 border border-white/[0.08] text-xs font-mono text-slate-300">
                    PNG, JPG, JPEG &bull; Standard Frontal Thoracic
                  </span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Benchmark Test Cases */}
                <div className="lg:col-span-6 clinora-card p-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles size={16} className="text-cyan-400" />
                        Benchmark Hold-Out Cases
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        880 Held-Out Partitions
                      </span>
                    </div>

                    <div className="space-y-3">
                      {samples.map((s) => {
                        const isNorm = s.label === "NORMAL";
                        return (
                          <button
                            key={s.key}
                            onClick={() => handleSamplePredict(s.key)}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/90 border border-white/[0.06] hover:border-cyan-500/30 transition-all text-left group"
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors block">
                                {s.name}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                {s.desc}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-extrabold px-3 py-1 rounded-full border tracking-wider uppercase whitespace-nowrap ml-3 ${
                                isNorm
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              }`}
                            >
                              {s.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2">
                    <Info size={14} className="text-cyan-400 shrink-0" />
                    <span>Select any benchmark case to load calibrated diagnostic findings instantly.</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* =================================================================
              LOADING STATE
              ================================================================= */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-28 space-y-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-slate-800 border-t-cyan-400 animate-spin" />
                <Scan className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">
                  Executing EfficientNetB0 Inference
                </h3>
                <p className="text-xs text-slate-400">
                  Synthesizing Grad-CAM spatial gradients on top_conv layer
                </p>
                <p className="text-xs font-mono text-cyan-400 pt-1">
                  {fileName}
                </p>
              </div>
            </motion.div>
          )}

          {/* =================================================================
              ERROR STATE
              ================================================================= */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="clinora-card p-6 border-rose-500/40 bg-rose-950/20"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <XCircle size={24} className="shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-rose-300">Inference Interrupted</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 transition-colors"
              >
                Reset / Try Again
              </button>
            </motion.div>
          )}

          {/* =================================================================
              DIAGNOSTIC DASHBOARD (DRIBBLE CLINORA STYLE)
              ================================================================= */}
          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isPneumonia
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {isPneumonia ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-white">
                          {isPneumonia ? "Warning: Pneumonia Indicated" : "Normal Radiograph (Clear)"}
                        </h2>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isPneumonia
                              ? "bg-rose-500/25 text-rose-300 border border-rose-500/40"
                              : "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {result.pred_label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Examined Case: <strong className="text-slate-200">{fileName}</strong>
                        {result.ground_truth && (
                          <span className="ml-2 text-slate-500">
                            &bull; Reference Ground Truth: <strong className="text-cyan-400">{result.ground_truth}</strong>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* =============================================================
                    STAGE 1 (TOP): HIGHLIGHTED EXPLAINABLE AI (XAI) ENGINE
                    ============================================================= */}
                <div className="xai-hero-card p-6 sm:p-7 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-black uppercase tracking-wider shadow-sm shadow-cyan-500/20 animate-pulse">
                          <Flame size={13} className="text-cyan-400" />
                          ★ Key Explainability Engine (XAI)
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Layer: <strong className="text-cyan-300">top_conv (7×7×1280)</strong>
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold text-white tracking-tight pt-1">
                        Gradient-Weighted Class Activation Maps (Grad-CAM)
                      </h2>
                      <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                        Visualizing the exact pixel regions that compelled the deep learning model to make this diagnostic decision. Warmer spectrum intensities (red, yellow) identify pulmonary alveolar opacification and consolidations.
                      </p>
                    </div>

                    <div className="flex items-center bg-slate-950/90 p-1 rounded-full border border-white/[0.08] text-xs shrink-0 self-start sm:self-center">
                      <button
                        onClick={() => setActiveImageView("triplet")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-semibold ${
                          activeImageView === "triplet"
                            ? "bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Layers size={13} />
                        <span>Tri-View Comparison</span>
                      </button>
                      <button
                        onClick={() => setActiveImageView("overlay")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-semibold ${
                          activeImageView === "overlay"
                            ? "bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Eye size={13} />
                        <span>Fused Overlay</span>
                      </button>
                    </div>
                  </div>

                  {/* Tri-View Images (Clinora Modern Rounded Style) */}
                  {activeImageView === "triplet" ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* 1. Original Radiograph */}
                      <div className="clinora-card p-4 space-y-3 bg-slate-950/70 border border-white/[0.08] group hover:border-cyan-500/40 transition-all">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            Original Radiograph
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">224×224 RGB</span>
                        </div>
                        <div className="rounded-2xl overflow-hidden aspect-square bg-black/60 flex items-center justify-center border border-white/[0.06]">
                          <img
                            src={`data:image/png;base64,${result.images.original}`}
                            alt="Original Radiograph"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 text-center font-medium">
                          Standardized frontal thoracic view
                        </p>
                      </div>

                      {/* 2. Grad-CAM Thermal Heatmap */}
                      <div className="clinora-card p-4 space-y-3 bg-slate-950/70 border border-cyan-500/40 hover:border-cyan-400 transition-all shadow-[0_0_25px_rgba(6,182,212,0.1)] group">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-cyan-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            Grad-CAM Thermal Heatmap
                          </span>
                          <span className="font-mono text-[11px] text-cyan-400 font-bold">COLORMAP_JET</span>
                        </div>
                        <div className="rounded-2xl overflow-hidden aspect-square bg-black/60 flex items-center justify-center border border-cyan-500/30">
                          <img
                            src={`data:image/png;base64,${result.images.heatmap}`}
                            alt="Grad-CAM Thermal Heatmap"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 text-center font-medium">
                          Gradients backpropagated to top_conv
                        </p>
                      </div>

                      {/* 3. Superimposed Overlay */}
                      <div className="clinora-card p-4 space-y-3 bg-slate-950/70 border border-white/[0.08] group hover:border-cyan-500/40 transition-all">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Superimposed Overlay
                          </span>
                          <span className="font-mono text-[11px] text-emerald-400 font-bold">α = 0.40 Blend</span>
                        </div>
                        <div className="rounded-2xl overflow-hidden aspect-square bg-black/60 flex items-center justify-center border border-white/[0.06]">
                          <img
                            src={`data:image/png;base64,${result.images.overlay}`}
                            alt="Superimposed Overlay"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 text-center font-medium">
                          Radiological anatomical fusion
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl overflow-hidden border border-cyan-500/30 bg-black/60 max-w-lg mx-auto p-3">
                      <img
                        src={`data:image/png;base64,${result.images.overlay}`}
                        alt="Superimposed Overlay"
                        className="w-full aspect-square object-cover rounded-xl"
                      />
                    </div>
                  )}

                  {/* Activation Intensity Bar (with Clinora scale ticks) */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.06] space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-2">
                        <Activity size={15} className="text-cyan-400" />
                        Grad-CAM Salient Activation Coverage:
                        <strong className="text-cyan-400 font-mono text-sm">{result.salient_pct.toFixed(1)}%</strong>
                        <span className="text-slate-400 font-normal">of thoracic field</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Peak Saliency Pixel: [Y={result.y_peak}, X={result.x_peak}]
                      </span>
                    </div>

                    <div className="h-3 rounded-full bg-slate-900 overflow-hidden border border-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(result.salient_pct * 4, 100)}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-rose-500"
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                      <span>0% (Aerated Baseline)</span>
                      <span className="text-slate-400 font-bold">Decision Boundary: τ = 0.50</span>
                      <span>100% (Dense Infiltrate)</span>
                    </div>
                  </div>
                </div>

                {/* =============================================================
                    STAGE 2 (BELOW): CLINORA 3-COLUMN DIAGNOSTIC GRID
                    Left: 3D Thoracic Twin
                    Middle: Lung Function / Efficiency & "Why the Risk?"
                    Right: Medication & Therapy (Clinical Protocol)
                    ============================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left 5 Cols: 3D Thoracic Twin (Matching Dribbble Hero) */}
                  <div className="lg:col-span-5 h-[500px]">
                    <LungVisualization3D
                      predLabel={result.pred_label}
                      hemithorax={result.hemithorax}
                      zone={result.zone}
                      salientPct={result.salient_pct}
                      isIdle={false}
                    />
                  </div>

                  {/* Middle 4 Cols: "Lung Function Efficiency" & "Why the Risk?" */}
                  <div className="lg:col-span-4 space-y-5">
                    
                    {/* Card 1: Diagnostic Efficiency / Risk Level */}
                    <div className="clinora-card p-6 space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">
                          Diagnostic Confidence
                        </span>
                        <ArrowRight size={14} className="text-slate-400 -rotate-45" />
                      </div>

                      <div>
                        <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-2">
                          {result.confidence.toFixed(0)}%
                          <span className="text-xs font-semibold text-slate-400 font-sans">
                            {isPneumonia ? "High Risk (Infiltrate)" : "Optimal (Aerated)"}
                          </span>
                        </div>
                      </div>

                      {/* Clinora-style gradient progress capsule */}
                      <div className="space-y-1.5 pt-1">
                        <div className="h-3 rounded-full bg-slate-900 overflow-hidden border border-white/[0.08]">
                          <div
                            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-400 via-cyan-400 to-rose-500"
                            style={{ width: `${Math.min(result.confidence, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>00</span>
                          <span>100</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Clinora-style "Why the Risk?" */}
                    <div className="clinora-card p-6 space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white text-sm">
                          Why the Risk?
                        </span>
                        <span className="text-cyan-400 text-xs font-semibold">
                          Evidence Audit
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {/* Item 1 */}
                        <div className="space-y-1">
                          <span className="text-xs text-slate-400 font-medium">
                            {isPneumonia ? "Calculated Pneumonia Probability" : "Clear Parenchymal Density"}
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold font-mono text-white">
                              {(result.prob * 100).toFixed(1)}%
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Prob
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">
                            {result.diag_reason}
                          </p>
                        </div>

                        {/* Item 2 */}
                        <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                          <span className="text-xs text-slate-400 font-medium">
                            Anatomical Hotspot Peak
                          </span>
                          <div className="text-sm font-bold text-white">
                            {result.hemithorax} &bull; {result.zone}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">
                            {result.saliency_reason}
                          </p>
                        </div>

                        {/* Item 3 */}
                        <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                          <span className="text-xs text-slate-400 font-medium">
                            Clinical Triage
                          </span>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {result.triage_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right 3 Cols: Clinora "Medication & Therapy" Clinical Protocol */}
                  <div className="lg:col-span-3 clinora-card p-6 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white text-sm">
                        Clinical Protocol
                      </span>
                      <Sparkles size={14} className="text-cyan-400" />
                    </div>

                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-0.5">
                        <span className="text-xs font-bold text-slate-200 block">
                          Oxygen &amp; Airway Support
                        </span>
                        <span className="text-[11px] text-slate-400 block leading-tight">
                          Maintain SpO2 &gt; 94% with humidified nasal cannula if dyspnea observed.
                        </span>
                      </div>

                      {/* Step 2 */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-0.5">
                        <span className="text-xs font-bold text-slate-200 block">
                          Targeted Antimicrobial Therapy
                        </span>
                        <span className="text-[11px] text-slate-400 block leading-tight">
                          Confirm bacterial vs viral etiology via CRP/Procalcitonin before empiric antibiotics.
                        </span>
                      </div>

                      {/* Step 3 */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-0.5">
                        <span className="text-xs font-bold text-slate-200 block">
                          Radiology Second-Look
                        </span>
                        <span className="text-[11px] text-slate-400 block leading-tight">
                          Correlate Grad-CAM saliency hotspot with lateral chest view.
                        </span>
                      </div>

                      {/* Step 4 */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-0.5">
                        <span className="text-xs font-bold text-slate-200 block">
                          Serial Follow-Up Scan
                        </span>
                        <span className="text-[11px] text-slate-400 block leading-tight">
                          Re-evaluate in 48-72 hours to verify resolution of consolidation.
                        </span>
                      </div>
                    </div>

                    {/* Dribbble button */}
                    <div className="pt-2">
                      <button
                        onClick={() => window.print()}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-102"
                      >
                        <span>Export Full Report (PDF)</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <Footer />
    </div>
  );
}
