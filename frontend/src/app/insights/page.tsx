"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  GitCompareArrows,
  Layers,
  Brain,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DisclaimerBanner from "@/components/DisclaimerBanner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// Comparison table data from EXPERIMENTS.md
const comparisonData = [
  { param: "Base Layers Trainable", stage1: "0 of 237", stage2: "30 of 237", delta: "Top abstract conv blocks adapted" },
  { param: "Learning Rate", stage1: "2.0 × 10⁻⁴ (decayed)", stage2: "1.0 × 10⁻⁵", delta: "Controlled fine-tuning rate" },
  { param: "Validation Loss", stage1: "0.2345", stage2: "0.2295", delta: "-0.0050 (Improved)", improved: true },
  { param: "Validation Accuracy", stage1: "89.97%", stage2: "89.85%", delta: "-0.12%", improved: false },
  { param: "Validation AUC", stage1: "0.9802", stage2: "0.9873", delta: "+0.0071 (Improved)", improved: true },
  { param: "Validation Precision", stage1: "98.25%", stage2: "98.93%", delta: "+0.68% (Improved)", improved: true },
  { param: "Validation Recall", stage1: "87.81%", stage2: "87.03%", delta: "-0.78%", improved: false },
  { param: "Model Selection", stage1: "Baseline checkpoint", stage2: "Selected as FINAL", delta: "Lower loss & superior AUC" },
];

interface TrainingHistory {
  accuracy: number[];
  auc: number[];
  loss: number[];
  precision: number[];
  recall: number[];
  val_accuracy: number[];
  val_auc: number[];
  val_loss: number[];
  val_precision: number[];
  val_recall: number[];
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="glass-card-static p-3 text-xs border border-white/10">
      <p className="font-semibold mb-1 text-[var(--text-primary)]">Epoch {label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="flex justify-between gap-4">
          <span>{entry.name}:</span>
          <span className="font-mono">{entry.value.toFixed(4)}</span>
        </p>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const [history, setHistory] = useState<{ stage1?: TrainingHistory; stage2?: TrainingHistory } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/training-history`)
      .then((res) => res.json())
      .then(setHistory)
      .catch(() => setHistory(null))
      .finally(() => setLoading(false));
  }, []);

  // Format training history for charts
  const formatData = (stage?: TrainingHistory) => {
    if (!stage) return [];
    return stage.accuracy.map((_, i) => ({
      epoch: i + 1,
      accuracy: stage.accuracy[i],
      val_accuracy: stage.val_accuracy[i],
      loss: stage.loss[i],
      val_loss: stage.val_loss[i],
      auc: stage.auc[i],
      val_auc: stage.val_auc[i],
    }));
  };

  const stage2Data = formatData(history?.stage2);
  const stage1Data = formatData(history?.stage1);

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14]">
      <Navbar />
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-6 space-y-6">
        <DisclaimerBanner />

            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="mt-6"
            >
              <motion.h1
                variants={fadeUp}
                className="text-2xl font-bold mb-2"
              >
                Model Insights
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="text-sm text-[var(--text-secondary)] mb-8"
              >
                Full technical report: training curves, evaluation metrics, and
                Stage 1 vs Stage 2 comparison.
              </motion.p>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={36} className="text-[var(--cyan)] animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* ====== TRAINING CURVES ====== */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Accuracy Chart */}
                    <motion.div variants={fadeUp} className="glass-card-static p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={18} className="text-[var(--cyan)]" />
                        <h3 className="text-sm font-semibold">
                          Training Accuracy (Stage 2 Fine-Tuning)
                        </h3>
                      </div>
                      {stage2Data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <LineChart data={stage2Data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="epoch" tick={{ fill: "#8b92b3", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                            <YAxis domain={[0.85, 0.95]} tick={{ fill: "#8b92b3", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: "#8b92b3" }} />
                            <Line type="monotone" dataKey="accuracy" stroke="#00e5ff" strokeWidth={2} dot={{ r: 3 }} name="Train Accuracy" />
                            <Line type="monotone" dataKey="val_accuracy" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Val Accuracy" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-sm text-[var(--text-muted)]">
                          <img src={`${API_BASE}/api/plots/accuracy_finetune`} alt="Accuracy curve" className="max-h-full rounded-lg" />
                        </div>
                      )}
                    </motion.div>

                    {/* Loss Chart */}
                    <motion.div variants={fadeUp} className="glass-card-static p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingDown size={18} className="text-[var(--amber-red)]" />
                        <h3 className="text-sm font-semibold">
                          Training Loss (Stage 2 Fine-Tuning)
                        </h3>
                      </div>
                      {stage2Data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <LineChart data={stage2Data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="epoch" tick={{ fill: "#8b92b3", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                            <YAxis tick={{ fill: "#8b92b3", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: "#8b92b3" }} />
                            <Line type="monotone" dataKey="loss" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Train Loss" />
                            <Line type="monotone" dataKey="val_loss" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Val Loss" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-sm text-[var(--text-muted)]">
                          <img src={`${API_BASE}/api/plots/loss_finetune`} alt="Loss curve" className="max-h-full rounded-lg" />
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* AUC Chart */}
                  <motion.div variants={fadeUp} className="glass-card-static p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity size={18} className="text-[var(--teal)]" />
                      <h3 className="text-sm font-semibold">
                        AUC Progress (Stage 2 Fine-Tuning)
                      </h3>
                    </div>
                    {stage2Data.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={stage2Data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="epoch" tick={{ fill: "#8b92b3", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                          <YAxis domain={[0.95, 1]} tick={{ fill: "#8b92b3", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11, color: "#8b92b3" }} />
                          <Area type="monotone" dataKey="auc" stroke="#00bfa6" fill="rgba(0,191,166,0.1)" strokeWidth={2} name="Train AUC" />
                          <Area type="monotone" dataKey="val_auc" stroke="#00e5ff" fill="rgba(0,229,255,0.05)" strokeWidth={2} name="Val AUC" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)] text-center py-8">
                        Training history not available — start the API server to load data.
                      </p>
                    )}
                  </motion.div>

                  {/* ====== CONFUSION MATRIX + ROC CURVE ====== */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Confusion Matrix */}
                    <motion.div variants={fadeUp} className="glass-card-static p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 size={18} className="text-[var(--cyan)]" />
                        <h3 className="text-sm font-semibold">
                          Test Set Confusion Matrix
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mb-4">
                        N=880, threshold τ=0.50
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center max-w-sm mx-auto">
                        <div />
                        <div className="text-xs text-[var(--text-muted)] font-medium py-2">Pred. NORMAL</div>
                        <div className="text-xs text-[var(--text-muted)] font-medium py-2">Pred. PNEUMONIA</div>

                        <div className="text-xs text-[var(--text-muted)] font-medium flex items-center justify-end pr-2">Actual NORMAL</div>
                        <div className="cm-cell bg-[var(--green-clinical)]/15 border border-[var(--green-clinical)]/30">
                          <span className="text-[var(--green-clinical)]">229</span>
                          <span className="text-[10px] text-[var(--text-muted)]">TN</span>
                        </div>
                        <div className="cm-cell bg-[var(--amber-red)]/10 border border-[var(--amber-red)]/20">
                          <span className="text-[var(--amber-red)]">9</span>
                          <span className="text-[10px] text-[var(--text-muted)]">FP</span>
                        </div>

                        <div className="text-xs text-[var(--text-muted)] font-medium flex items-center justify-end pr-2">Actual PNEUMONIA</div>
                        <div className="cm-cell bg-[var(--red-clinical)]/15 border border-[var(--red-clinical)]/30">
                          <span className="text-[var(--red-clinical)]">67</span>
                          <span className="text-[10px] text-[var(--text-muted)]">FN</span>
                        </div>
                        <div className="cm-cell bg-[var(--green-clinical)]/15 border border-[var(--green-clinical)]/30">
                          <span className="text-[var(--green-clinical)]">575</span>
                          <span className="text-[10px] text-[var(--text-muted)]">TP</span>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <p className="text-xs text-[var(--text-muted)]">False Negatives</p>
                          <p className="text-sm font-bold text-[var(--red-clinical)]">67 cases</p>
                          <p className="text-[10px] text-[var(--text-muted)]">Most clinically critical</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[var(--text-muted)]">False Positives</p>
                          <p className="text-sm font-bold text-[var(--amber-red)]">9 cases</p>
                          <p className="text-[10px] text-[var(--text-muted)]">3.78% false alarm rate</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* ROC Curve (static image from backend) */}
                    <motion.div variants={fadeUp} className="glass-card-static p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity size={18} className="text-[var(--teal)]" />
                        <h3 className="text-sm font-semibold">
                          ROC Curve (AUC = 0.9873)
                        </h3>
                      </div>
                      <div className="flex items-center justify-center bg-black/20 rounded-lg p-4 min-h-[280px]">
                        <img
                          src={`${API_BASE}/api/plots/roc_curve`}
                          alt="ROC Curve — AUC 0.9873"
                          className="max-h-[260px] rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* ====== STAGE COMPARISON TABLE ====== */}
                  <motion.div variants={fadeUp} className="glass-card-static p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <GitCompareArrows size={18} className="text-[var(--cyan)]" />
                      <h3 className="text-sm font-semibold">
                        Stage 1 vs Stage 2 — Head-to-Head Comparison
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-3 text-[var(--text-muted)] font-medium">Parameter / Metric</th>
                            <th className="text-center py-3 px-3 text-[var(--text-muted)] font-medium">
                              <span className="flex items-center justify-center gap-1">
                                <Layers size={12} /> Stage 1 (Frozen)
                              </span>
                            </th>
                            <th className="text-center py-3 px-3 text-[var(--text-muted)] font-medium">
                              <span className="flex items-center justify-center gap-1">
                                <Brain size={12} /> Stage 2 (Fine-Tuned)
                              </span>
                            </th>
                            <th className="text-center py-3 px-3 text-[var(--text-muted)] font-medium">Assessment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.map((row, i) => (
                            <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                              <td className="py-2.5 px-3 font-medium">{row.param}</td>
                              <td className="py-2.5 px-3 text-center font-mono text-[var(--text-secondary)]">{row.stage1}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-semibold">{row.stage2}</td>
                              <td className={`py-2.5 px-3 text-center ${
                                row.improved === true ? "text-[var(--green-clinical)]" :
                                row.improved === false ? "text-[var(--amber-red)]" :
                                "text-[var(--text-muted)]"
                              }`}>
                                {row.delta}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>

                  {/* Static plot images as fallback reference */}
                  <motion.div variants={fadeUp} className="glass-card-static p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 size={18} className="text-[var(--cyan)]" />
                      <h3 className="text-sm font-semibold">
                        Generated Evaluation Plots
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { name: "accuracy_finetune", label: "Accuracy (Fine-tune)" },
                        { name: "loss_finetune", label: "Loss (Fine-tune)" },
                        { name: "confusion_matrix", label: "Confusion Matrix" },
                        { name: "roc_curve", label: "ROC Curve" },
                      ].map((plot) => (
                        <div key={plot.name} className="text-center">
                          <div className="bg-black/20 rounded-lg p-2 border border-white/[0.06]">
                            <img
                              src={`${API_BASE}/api/plots/${plot.name}`}
                              alt={plot.label}
                              className="w-full rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).alt = "Plot unavailable — start API server";
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] mt-2">{plot.label}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>

        <div className="mt-8">
          <DisclaimerBanner />
        </div>
      </main>
      <Footer />
    </div>
  );
}
