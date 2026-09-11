"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
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
  Crosshair,
  Award,
  Stethoscope,
  Database,
  FlaskConical,
  Pipette,
  ImageIcon,
  SquareFunction,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import DisclaimerBanner from "@/components/DisclaimerBanner";

const LungVisualization3D = dynamic(
  () => import("@/components/LungVisualization3D"),
  { ssr: false, loading: () => <div className="w-full h-[400px] flex items-center justify-center text-[var(--text-muted)]">Loading 3D Model...</div> }
);

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// Static data
const pipeline = [
  { icon: ImageIcon, title: "Input & Preprocessing", desc: "RGB conversion, 224x224 resize, EfficientNet preprocess_input", color: "#3b82f6" },
  { icon: Brain, title: "EfficientNetB0 Backbone", desc: "4.05M params, MBConv + Squeeze-and-Excitation blocks", color: "#22c55e" },
  { icon: Target, title: "Classification Head", desc: "GAP → Dropout(0.2) → Dense(1, sigmoid), threshold τ=0.50", color: "#f59e0b" },
  { icon: Eye, title: "Grad-CAM XAI Engine", desc: "top_conv gradients → ReLU → 7×7→224×224 heatmap", color: "#a855f7" },
  { icon: Monitor, title: "Presentation Layer", desc: "Interactive dashboard with clinical reasoning & disclaimers", color: "#ef4444" },
];

const techStack = [
  { icon: Cpu, name: "TensorFlow & Keras", role: "Deep Learning Core", detail: "tf.GradientTape for exact Grad-CAM backpropagation, oneDNN CPU acceleration, .keras serialization" },
  { icon: Brain, name: "EfficientNetB0", role: "Feature Extractor (Backbone)", detail: "4.05M parameters — compound-scaled MBConv blocks prevent over-parameterization on N=4,099 training images" },
  { icon: Eye, name: "Grad-CAM (XAI)", role: "Decision Explainability", detail: "Spatial saliency maps revealing where the model looks — detecting shortcut learning & validating alveolar consolidation" },
  { icon: Scan, name: "OpenCV (cv2)", role: "Image Processing", detail: "COLORMAP_JET pseudo-coloring, bicubic resize, alpha-blend overlays for clinical thermal heatmaps" },
  { icon: BarChart3, name: "Scikit-learn", role: "Metrics & Class Weighting", detail: "Balanced class weights (NORMAL 1.85 / PNEUMONIA 0.69), confusion matrix, multi-threshold ROC-AUC" },
  { icon: Layers, name: "Pillow & NumPy", role: "Image Ingestion & Tensors", detail: "Handles arbitrary bit depths/channels → standardized RGB (1, 224, 224, 3) float tensors" },
];

const metrics = [
  { label: "Accuracy", value: "91.36%", detail: "804 / 880 correct" },
  { label: "Precision", value: "98.46%", detail: "575 / 584 true positives" },
  { label: "Recall / Sensitivity", value: "89.56%", detail: "575 / 642 detected" },
  { label: "Specificity", value: "96.22%", detail: "229 / 238 true normals" },
  { label: "F1-Score", value: "0.9380", detail: "Harmonic mean" },
  { label: "ROC-AUC", value: "0.9873", detail: "Near-perfect separability" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 ml-16 overflow-y-auto">

          {/* ============================================
              1. HERO SECTION
              ============================================ */}
          <section className="relative px-8 pt-12 pb-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left: Text */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="space-y-6"
                >
                  <motion.div variants={fadeUp}>
                    <DisclaimerBanner />
                  </motion.div>
                  <motion.h1
                    variants={fadeUp}
                    className="text-4xl md:text-5xl font-bold leading-tight"
                  >
                    <span className="gradient-text">Pneumora</span>
                  </motion.h1>
                  <motion.p
                    variants={fadeUp}
                    className="text-lg text-[var(--text-secondary)] leading-relaxed"
                  >
                    AI-Powered, Explainable Chest X-Ray Pneumonia Screening
                  </motion.p>
                  <motion.p
                    variants={fadeUp}
                    className="text-[var(--text-muted)] leading-relaxed max-w-xl"
                  >
                    An end-to-end deep learning system for automated binary
                    detection of pneumonia from chest radiographs, integrated
                    with Gradient-weighted Class Activation Mapping (Grad-CAM)
                    for clinical explainability. Powered by EfficientNetB0 with
                    two-stage fine-tuning, achieving 91.36% accuracy and 0.9873
                    ROC-AUC on 880 held-out test images.
                  </motion.p>
                  <motion.div variants={fadeUp}>
                    <Link
                      href="/analyze"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--teal)] text-[var(--navy)] font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all hover:scale-105"
                    >
                      Launch Analyzer
                      <ArrowRight size={18} />
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Right: 3D Lung */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-[400px] lg:h-[450px]"
                >
                  <LungVisualization3D isIdle />
                </motion.div>
              </div>
            </div>
          </section>

          {/* ============================================
              2. PROBLEM STATEMENT
              ============================================ */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="px-8 py-16"
          >
            <div className="max-w-4xl mx-auto">
              <motion.div variants={fadeUp} className="glass-card p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[var(--cyan)]/10 text-[var(--cyan)]">
                    <Shield size={28} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold">
                      Why Automated, Explainable Pneumonia Screening?
                    </h2>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      Pneumonia remains a leading cause of death globally,
                      responsible for over 2.5 million deaths annually. Chest
                      X-rays are the primary diagnostic tool, yet interpretation
                      depends heavily on radiologist expertise — a scarce
                      resource in many healthcare systems. Misdiagnosis leads
                      to delayed treatment, unnecessary antibiotics, or missed
                      critical cases.
                    </p>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      Deep learning models can assist clinical decision-making,
                      but &ldquo;black box&rdquo; predictions are unacceptable in medicine.
                      Grad-CAM provides visual accountability — showing{" "}
                      <em>where</em> the model focuses — enabling clinicians to
                      verify predictions, detect algorithmic bias (e.g.,
                      &ldquo;shortcut learning&rdquo; from text markers), and build
                      justified trust in AI-assisted diagnosis.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* ============================================
              3. PIPELINE INFOGRAPHIC
              ============================================ */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="px-8 py-16"
          >
            <div className="max-w-6xl mx-auto">
              <motion.h2
                variants={fadeUp}
                className="text-2xl font-bold text-center mb-12"
              >
                System Architecture Pipeline
              </motion.h2>
              <div className="flex flex-col lg:flex-row items-stretch gap-4">
                {pipeline.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.title}
                      variants={fadeUp}
                      className="flex-1 glass-card p-6 relative"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: step.color + "1a", color: step.color }}
                        >
                          <Icon size={20} />
                        </div>
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          Tier {i + 1}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm mb-2">{step.title}</h3>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {step.desc}
                      </p>
                      {/* Connector arrow */}
                      {i < pipeline.length - 1 && (
                        <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-[var(--cyan)] z-10">
                          <ArrowRight size={16} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* ============================================
              4. TECHNOLOGY STACK GRID
              ============================================ */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="px-8 py-16"
          >
            <div className="max-w-6xl mx-auto">
              <motion.h2
                variants={fadeUp}
                className="text-2xl font-bold text-center mb-12"
              >
                Technology Stack
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {techStack.map((tech) => {
                  const Icon = tech.icon;
                  return (
                    <motion.div
                      key={tech.name}
                      variants={fadeUp}
                      className="glass-card p-6"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-[var(--cyan)]/10 text-[var(--cyan)]">
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{tech.name}</h3>
                          <p className="text-xs text-[var(--cyan)]">{tech.role}</p>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {tech.detail}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* ============================================
              5. DATASET & TRAINING INFOGRAPHIC
              ============================================ */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="px-8 py-16"
          >
            <div className="max-w-6xl mx-auto">
              <motion.h2
                variants={fadeUp}
                className="text-2xl font-bold text-center mb-12"
              >
                Dataset &amp; Training
              </motion.h2>

              {/* Dataset stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Images", value: "5,856", sub: "Chest X-Rays" },
                  { label: "NORMAL", value: "1,583", sub: "27% of dataset" },
                  { label: "PNEUMONIA", value: "4,273", sub: "73% of dataset" },
                  { label: "Split Ratio", value: "70/15/15", sub: "Train / Val / Test" },
                ].map((stat) => (
                  <motion.div key={stat.label} variants={fadeUp} className="metric-card">
                    <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                    <p className="text-sm font-medium mt-1">{stat.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{stat.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Split details + class weights + training */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <motion.div variants={fadeUp} className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Database size={18} className="text-[var(--cyan)]" />
                    <h3 className="font-semibold text-sm">Data Splits</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Training</span>
                      <span className="font-mono">4,099</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Validation</span>
                      <span className="font-mono">877</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Test (Held-out)</span>
                      <span className="font-mono">880</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FlaskConical size={18} className="text-[var(--cyan)]" />
                    <h3 className="font-semibold text-sm">Class Weights</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">NORMAL</span>
                      <span className="font-mono text-[var(--green-clinical)]">1.8497</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">PNEUMONIA</span>
                      <span className="font-mono text-[var(--amber-red)]">0.6852</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-white/5">
                      Balanced mode — prevents majority-class bias on 2.7:1 imbalanced data
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={18} className="text-[var(--cyan)]" />
                    <h3 className="font-semibold text-sm">Two-Stage Training</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Stage 1: Frozen Base</p>
                      <p className="font-mono text-xs">
                        Best Epoch 12 — val_loss: 0.2345, AUC: 0.9802
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Stage 2: Top 30 Layers</p>
                      <p className="font-mono text-xs">
                        Best Epoch 9 — val_loss: 0.2295, AUC: 0.9873
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* ============================================
              6. RESULTS INFOGRAPHIC
              ============================================ */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="px-8 py-16"
          >
            <div className="max-w-6xl mx-auto">
              <motion.h2
                variants={fadeUp}
                className="text-2xl font-bold text-center mb-12"
              >
                Test Set Results
              </motion.h2>

              {/* Metric cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {metrics.map((m) => (
                  <motion.div key={m.label} variants={fadeUp} className="metric-card">
                    <p className="text-2xl font-bold gradient-text">{m.value}</p>
                    <p className="text-xs font-medium mt-1">{m.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{m.detail}</p>
                  </motion.div>
                ))}
              </div>

              {/* Confusion Matrix */}
              <motion.div variants={fadeUp} className="glass-card p-6 max-w-md mx-auto">
                <h3 className="text-sm font-semibold text-center mb-4">
                  Confusion Matrix (N=880, τ=0.50)
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* Header row */}
                  <div />
                  <div className="text-xs text-[var(--text-muted)] font-medium py-2">
                    Pred. NORMAL
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-medium py-2">
                    Pred. PNEUMONIA
                  </div>

                  {/* Actual NORMAL row */}
                  <div className="text-xs text-[var(--text-muted)] font-medium flex items-center justify-end pr-3">
                    Actual NORMAL
                  </div>
                  <div className="cm-cell bg-[var(--green-clinical)]/15 border border-[var(--green-clinical)]/30">
                    <span className="text-[var(--green-clinical)]">229</span>
                    <span className="text-[10px] text-[var(--text-muted)]">TN</span>
                  </div>
                  <div className="cm-cell bg-[var(--amber-red)]/10 border border-[var(--amber-red)]/20">
                    <span className="text-[var(--amber-red)]">9</span>
                    <span className="text-[10px] text-[var(--text-muted)]">FP</span>
                  </div>

                  {/* Actual PNEUMONIA row */}
                  <div className="text-xs text-[var(--text-muted)] font-medium flex items-center justify-end pr-3">
                    Actual PNEUMONIA
                  </div>
                  <div className="cm-cell bg-[var(--red-clinical)]/15 border border-[var(--red-clinical)]/30">
                    <span className="text-[var(--red-clinical)]">67</span>
                    <span className="text-[10px] text-[var(--text-muted)]">FN</span>
                  </div>
                  <div className="cm-cell bg-[var(--green-clinical)]/15 border border-[var(--green-clinical)]/30">
                    <span className="text-[var(--green-clinical)]">575</span>
                    <span className="text-[10px] text-[var(--text-muted)]">TP</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* ============================================
              7. DISCLAIMER BANNER (bottom)
              ============================================ */}
          <section className="px-8 pb-8">
            <div className="max-w-4xl mx-auto">
              <DisclaimerBanner />
            </div>
          </section>

          {/* ============================================
              8. FOOTER
              ============================================ */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
