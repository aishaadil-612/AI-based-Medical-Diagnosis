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
  MessageSquareWarning,
  Cpu,
  Brain,
  Eye,
  Layers,
  BarChart3,
  Stethoscope,
  HeartPulse,
  Wind,
  Pill,
  ChevronDown,
  ChevronUp,
  Loader2,
  ImageIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import DisclaimerBanner from "@/components/DisclaimerBanner";

const LungVisualization3D = dynamic(
  () => import("@/components/LungVisualization3D"),
  { ssr: false, loading: () => <div className="w-full h-[350px] flex items-center justify-center text-[var(--text-muted)]">Loading 3D Model...</div> }
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
  { key: "normal_1", name: "Sample 1: Normal Chest X-Ray", label: "NORMAL" },
  { key: "normal_2", name: "Sample 2: Normal Chest X-Ray", label: "NORMAL" },
  { key: "pneumonia_bacterial", name: "Sample 3: Bacterial Pneumonia", label: "PNEUMONIA" },
  { key: "pneumonia_viral", name: "Sample 4: Viral Pneumonia", label: "PNEUMONIA" },
  { key: "challenging_fn", name: "Sample 5: Challenging Case (FN)", label: "PNEUMONIA" },
];

export default function AnalyzePage() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 ml-16 overflow-y-auto">
          <div className="px-6 py-6 max-w-[1400px] mx-auto">
            {/* Top disclaimer */}
            <DisclaimerBanner />

            {/* Welcome / Upload area */}
            {!result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 mb-8"
              >
                <h1 className="text-2xl font-bold mb-2">
                  Welcome to <span className="gradient-text">Pneumora</span>
                </h1>
                <p className="text-[var(--text-secondary)] text-sm mb-8">
                  Upload a chest X-ray or choose a benchmark sample to run AI
                  screening with full Grad-CAM explainability.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upload zone */}
                  <div
                    className={`upload-zone ${dragOver ? "dragover" : ""}`}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload
                      size={40}
                      className="mx-auto mb-4 text-[var(--text-muted)]"
                    />
                    <p className="text-sm font-medium mb-1">
                      Drop a chest X-ray here, or click to browse
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Supports PNG, JPG, JPEG — frontal chest radiograph (AP or
                      PA view)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Sample selector */}
                  <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <ImageIcon size={16} className="text-[var(--cyan)]" />
                      Benchmark Test Samples
                    </h3>
                    <div className="space-y-2">
                      {samples.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => handleSamplePredict(s.key)}
                          className="w-full flex items-center justify-between p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[var(--cyan)]/20 transition-all text-left text-sm"
                        >
                          <span>{s.name}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              s.label === "NORMAL"
                                ? "bg-[var(--green-clinical)]/15 text-[var(--green-clinical)]"
                                : "bg-[var(--amber-red)]/15 text-[var(--amber-red)]"
                            }`}
                          >
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Loading state */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2
                  size={48}
                  className="text-[var(--cyan)] animate-spin mb-4"
                />
                <p className="text-sm text-[var(--text-secondary)]">
                  Analyzing radiograph and generating Grad-CAM heatmaps...
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {fileName}
                </p>
              </motion.div>
            )}

            {/* Error state */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-6 my-6 border-[var(--red-clinical)]/30"
              >
                <div className="flex items-center gap-3 text-[var(--red-clinical)]">
                  <XCircle size={20} />
                  <p className="text-sm">{error}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-4 text-xs text-[var(--cyan)] hover:underline"
                >
                  Try again
                </button>
              </motion.div>
            )}

            {/* ============================================
                RESULTS DASHBOARD
                ============================================ */}
            <AnimatePresence>
              {result && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6"
                >
                  {/* Reset button */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold">Diagnostic Results</h2>
                      <p className="text-xs text-[var(--text-muted)]">
                        {fileName}
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-sm transition-all"
                    >
                      <RotateCcw size={14} />
                      New Scan
                    </button>
                  </div>

                  {/* Main dashboard grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* ====== CENTER COLUMN (3D Lung + Badges + GradCAM) ====== */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* 3D Lung with floating badges */}
                      <div className="glass-card-static p-4 relative overflow-hidden">
                        <div className="h-[350px]">
                          <LungVisualization3D
                            predLabel={result.pred_label}
                            hemithorax={result.hemithorax}
                            zone={result.zone}
                            isIdle={false}
                          />
                        </div>

                        {/* Floating Result Badge */}
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`absolute top-4 left-4 animate-float px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold ${
                            isPneumonia
                              ? "bg-[var(--red-clinical)]/20 border border-[var(--red-clinical)]/40 text-[var(--red-clinical)] glow-red"
                              : "bg-[var(--green-clinical)]/20 border border-[var(--green-clinical)]/40 text-[var(--green-clinical)] glow-green"
                          }`}
                        >
                          {isPneumonia ? (
                            <ShieldAlert size={18} />
                          ) : (
                            <ShieldCheck size={18} />
                          )}
                          {isPneumonia
                            ? "PNEUMONIA DETECTED"
                            : "NORMAL X-RAY"}
                        </motion.div>

                        {/* Floating Confidence Chip */}
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          className="absolute top-4 right-4 animate-float px-4 py-2 rounded-full bg-white/[0.08] border border-white/[0.12] backdrop-blur-lg text-sm font-mono glow-cyan"
                          style={{ animationDelay: "0.5s" }}
                        >
                          {result.confidence.toFixed(1)}% Confidence
                        </motion.div>

                        {/* Ground truth tag if available */}
                        {result.ground_truth && (
                          <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg bg-white/[0.06] border border-white/[0.1] text-xs text-[var(--text-muted)]">
                            Ground Truth:{" "}
                            <span className="font-medium text-[var(--text-primary)]">
                              {result.ground_truth}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Grad-CAM Activation Strip */}
                      <div className="glass-card-static p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Eye size={16} className="text-[var(--cyan)]" />
                            Grad-CAM Activation Intensity
                          </h3>
                          <span className="text-xs text-[var(--text-muted)]">
                            Salient area: {result.salient_pct.toFixed(1)}% of
                            thoracic field
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(result.salient_pct * 5, 100)}%`,
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{
                              background:
                                "linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)",
                            }}
                          />
                        </div>
                      </div>

                      {/* Grad-CAM Triplet Viewer */}
                      <div className="glass-card-static p-4">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                          <Layers size={16} className="text-[var(--cyan)]" />
                          Explainable AI — Grad-CAM Visualizations
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mb-4">
                          The heatmap visualizes image regions that contributed
                          to the model&apos;s prediction. Warmer colors (red, yellow)
                          indicate anatomical features most influential in the
                          decision.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            {
                              label: "Original X-Ray (224×224)",
                              key: "original" as const,
                            },
                            {
                              label: "Grad-CAM Heatmap (top_conv)",
                              key: "heatmap" as const,
                            },
                            {
                              label: "Superimposed Overlay",
                              key: "overlay" as const,
                            },
                          ].map((img) => (
                            <div key={img.key} className="text-center">
                              <div className="rounded-lg overflow-hidden border border-white/[0.08] bg-black/20">
                                <img
                                  src={`data:image/png;base64,${result.images[img.key]}`}
                                  alt={img.label}
                                  className="w-full aspect-square object-cover"
                                />
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                {img.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ====== RIGHT COLUMN (Confidence + Reasoning + Tech + Next Steps) ====== */}
                    <div className="lg:col-span-5 space-y-5">
                      {/* Diagnostic Confidence Card */}
                      <div className="glass-card-static p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Gauge size={18} className="text-[var(--cyan)]" />
                          <h3 className="text-sm font-semibold">
                            Diagnostic Confidence
                          </h3>
                        </div>
                        <div className="text-center mb-4">
                          <p
                            className={`text-5xl font-bold ${
                              isPneumonia
                                ? "text-[var(--amber-red)]"
                                : "text-[var(--green-clinical)]"
                            }`}
                          >
                            {result.confidence.toFixed(1)}%
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            Raw Probability: {(result.prob * 100).toFixed(2)}%
                          </p>
                        </div>
                        {/* Gradient progress bar */}
                        <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${result.confidence}%`,
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full progress-gradient"
                          />
                        </div>
                        {/* Triage reason */}
                        <div
                          className={`p-3 rounded-lg text-xs leading-relaxed ${
                            result.triage_reason.includes("Borderline")
                              ? "bg-[var(--amber-red)]/10 border border-[var(--amber-red)]/20 text-[var(--amber-red)]"
                              : "bg-[var(--green-clinical)]/10 border border-[var(--green-clinical)]/20 text-[var(--green-clinical)]"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {result.triage_reason.includes("Borderline") ? (
                              <AlertTriangle size={14} />
                            ) : (
                              <CheckCircle2 size={14} />
                            )}
                            <span className="font-semibold">
                              {result.triage_reason.includes("Borderline")
                                ? "Borderline Triage Warning"
                                : "Diagnostic Concordance"}
                            </span>
                          </div>
                          {result.triage_reason}
                        </div>
                      </div>

                      {/* Why This Result? Card */}
                      <div className="glass-card-static p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <MessageSquareWarning
                            size={18}
                            className="text-[var(--cyan)]"
                          />
                          <h3 className="text-sm font-semibold">
                            Why This Result?
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {/* Diagnostic Reason */}
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-[var(--cyan)]/10 mt-0.5">
                              <Brain size={14} className="text-[var(--cyan)]" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold mb-1">
                                Diagnostic Rationale
                              </p>
                              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                {result.diag_reason}
                              </p>
                            </div>
                          </div>
                          {/* Saliency Reason */}
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-[var(--cyan)]/10 mt-0.5">
                              <Eye size={14} className="text-[var(--cyan)]" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold mb-1">
                                Anatomical Attention Mapping
                              </p>
                              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                {result.saliency_reason}
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* Expandable full report */}
                        <button
                          onClick={() =>
                            setExpandedReasoning(!expandedReasoning)
                          }
                          className="flex items-center gap-1 mt-4 text-xs text-[var(--cyan)] hover:underline"
                        >
                          {expandedReasoning
                            ? "Hide full report"
                            : "See full report"}
                          {expandedReasoning ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )}
                        </button>
                        <AnimatePresence>
                          {expandedReasoning && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-3 pt-3 border-t border-white/[0.06]"
                            >
                              <div className="text-xs text-[var(--text-muted)] space-y-2">
                                <p>
                                  <strong>Decision Threshold:</strong> Fixed at
                                  0.50. A predicted probability &ge; 0.50
                                  triggers a PNEUMONIA classification.
                                </p>
                                <p>
                                  <strong>Grad-CAM Feature Map:</strong>{" "}
                                  Extracted from layer top_conv (final
                                  convolutional stage of EfficientNetB0,
                                  dimension 7 × 7 × 1280).
                                </p>
                                <p>
                                  <strong>Hemithorax:</strong>{" "}
                                  {result.hemithorax}
                                </p>
                                <p>
                                  <strong>Zone:</strong> {result.zone}
                                </p>
                                <p>
                                  <strong>Peak Activation:</strong> Y=
                                  {result.y_peak}, X={result.x_peak}
                                </p>
                                <p>
                                  <strong>False Negative Risk:</strong> In
                                  clinical settings, a False Negative (Pneumonia
                                  classified as Normal) carries significant risk
                                  of delayed treatment. The model achieved
                                  89.56% Sensitivity on the 880-image held-out
                                  test set with ROC-AUC of 0.9873.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Model & Technology Card */}
                      <div className="glass-card-static p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Cpu size={18} className="text-[var(--cyan)]" />
                          <h3 className="text-sm font-semibold">
                            Model &amp; Technology
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {[
                            {
                              icon: Brain,
                              title: "EfficientNetB0 Backbone",
                              sub: "4.05M parameters, ImageNet pre-trained",
                            },
                            {
                              icon: Layers,
                              title: "Two-Stage Fine-Tuning",
                              sub: "Frozen base → Top 30 layers unfrozen",
                            },
                            {
                              icon: Eye,
                              title: "Grad-CAM Explainability",
                              sub: "top_conv layer, 7×7×1280 feature maps",
                            },
                            {
                              icon: BarChart3,
                              title: "Class-Weighted Training",
                              sub: "2.7:1 imbalance handled (weights: 1.85 / 0.69)",
                            },
                            {
                              icon: CheckCircle2,
                              title: "880-Image Held-Out Test",
                              sub: "91.36% accuracy, 0.9873 AUC",
                            },
                          ].map((item) => {
                            const Icon = item.icon;
                            return (
                              <div
                                key={item.title}
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                              >
                                <Icon
                                  size={16}
                                  className="text-[var(--cyan)] flex-shrink-0"
                                />
                                <div>
                                  <p className="text-xs font-medium">
                                    {item.title}
                                  </p>
                                  <p className="text-[10px] text-[var(--text-muted)]">
                                    {item.sub}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <a
                          href="/insights"
                          className="block mt-4 text-center text-xs px-4 py-2 rounded-lg bg-[var(--cyan)]/10 text-[var(--cyan)] hover:bg-[var(--cyan)]/15 transition-colors"
                        >
                          View Full Model Report
                        </a>
                      </div>

                      {/* Recommended Next Steps Card */}
                      <div className="glass-card-static p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Stethoscope
                            size={18}
                            className="text-[var(--cyan)]"
                          />
                          <h3 className="text-sm font-semibold">
                            Recommended Next Steps
                          </h3>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mb-3">
                          Static informational guidance — not tied to model
                          output
                        </p>
                        <div className="space-y-2.5">
                          {[
                            {
                              icon: Stethoscope,
                              name: "Pulmonologist",
                              desc: "Primary specialist for respiratory conditions",
                              tag: "Primary",
                            },
                            {
                              icon: Eye,
                              name: "Thoracic Radiologist",
                              desc: "Expert chest imaging interpretation",
                              tag: "Imaging",
                            },
                            {
                              icon: Wind,
                              name: "Sleep & Respiratory Medicine",
                              desc: "Respiratory function & sleep studies",
                              tag: "Specialty",
                            },
                            {
                              icon: HeartPulse,
                              name: "Pulmonary Medicine",
                              desc: "Advanced pulmonary diagnostics & care",
                              tag: "Advanced",
                            },
                          ].map((doc) => {
                            const Icon = doc.icon;
                            return (
                              <div
                                key={doc.name}
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]"
                              >
                                <Icon
                                  size={16}
                                  className="text-[var(--teal)] flex-shrink-0"
                                />
                                <div className="flex-1">
                                  <p className="text-xs font-medium">
                                    {doc.name}
                                  </p>
                                  <p className="text-[10px] text-[var(--text-muted)]">
                                    {doc.desc}
                                  </p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--teal)]/10 text-[var(--teal)]">
                                  {doc.tag}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom disclaimer */}
                  <div className="mt-8">
                    <DisclaimerBanner />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
