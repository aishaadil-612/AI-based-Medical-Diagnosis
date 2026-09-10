# EXPERIMENTS.md — AI Pneumonia Detection System
## Complete Experimental Record & Quantitative Tracking

This document preserves the authentic, unidealized experimental records across all development phases of the AI-Based Pneumonia Detection & Explainable AI system.

---

## 1. Dataset Configuration & Stratification

- **Raw Source:** Chest X-Ray Images (Pneumonia) dataset (`archive (5)/`)
- **Total Images:** 5,856 radiographs (NORMAL: 1,583 | PNEUMONIA: 4,273)
- **Split Ratio:** 70% Train / 15% Validation / 15% Test (Patient/image level stratification)
- **Resolved Split Counts:**
  - **Training Set:** 4,099 images (NORMAL: 1,108 | PNEUMONIA: 2,991)
  - **Validation Set:** 877 images (NORMAL: 237 | PNEUMONIA: 640)
  - **Held-Out Test Set:** 880 images (NORMAL: 238 | PNEUMONIA: 642)
- **Class Weights (Calculated on Training Set Only):**
  - $\text{Weight}_{\text{NORMAL}} = \frac{4099}{2 \times 1108} = \mathbf{1.8497}$
  - $\text{Weight}_{\text{PNEUMONIA}} = \frac{4099}{2 \times 2991} = \mathbf{0.6852}$

---

## 2. Preprocessing & Augmentation Protocol

- **Input Dimension:** $224 \times 224 \times 3$ (RGB)
- **Batch Size:** 32
- **Scaling Method:** `tensorflow.keras.applications.efficientnet.preprocess_input` (Preserves $[0, 255]$ raw values expected by EfficientNetB0 internal rescaling; manual $/255$ division was strictly avoided to prevent double-normalization distortion).
- **Data Augmentation (Training Set Only):**
  - Rotation: $\pm 10^\circ$
  - Width Shift: $10\%$
  - Height Shift: $10\%$
  - Zoom Range: $10\%$
  - *Horizontal Flip:* **Disabled** (Chest radiography is anatomically asymmetric — flipping distorts dextrocardia/levocardia, cardiac silhouette, aortic knob, and gastric bubble positioning).
- **Validation/Test Preprocessing:** Deterministic preprocessing only (no augmentation, `shuffle=False` for test evaluation).

---

## 3. Training Progression & Comparative Benchmarks

### Stage 1: Transfer Learning (Feature Extraction with Frozen Base)
- **Base Architecture:** EfficientNetB0 (ImageNet pre-trained weights, frozen base)
- **Classification Head:** GlobalAveragePooling2D $\to$ Dropout(0.2) $\to$ Dense(1, activation='sigmoid')
- **Optimizer:** Adam (Initial $\text{LR} = 10^{-3}$) with `ReduceLROnPlateau(factor=0.2, patience=2, min_lr=1e-5)`
- **Loss:** Binary Cross-Entropy (weighted)
- **Epochs Run:** 17 (Early stopping triggered; best weights restored from **Epoch 12**)

### Stage 2: Fine-Tuning (Top 30 Layers Unfrozen)
- **Unfrozen Layers:** Last 30 layers of EfficientNetB0 (top MBConv blocks + `top_conv`)
- **Optimizer:** Adam ($\text{LR} = 10^{-5}$, fixed small step size)
- **Batch Normalization:** Running statistics frozen (`training=False` preserved in call) to prevent batch-size-induced distribution drift.
- **Epochs Run:** 10 (Restored best weights from **Epoch 9**)

### Head-to-Head Validation Comparison Table

| Parameter / Metric | Stage 1 (Frozen Base, Epoch 12) | Stage 2 (Fine-Tuned, Epoch 9) | Delta / Assessment |
|---|---|---|---|
| **Base Layers Trainable** | 0 of 237 | 30 of 237 | Top abstract conv blocks adapted |
| **Learning Rate** | $2.0 \times 10^{-4}$ (decayed) | $1.0 \times 10^{-5}$ | Controlled fine-tuning rate |
| **Validation Loss** | 0.2345 | **0.2295** | **-0.0050 (Improved)** |
| **Validation Accuracy** | **0.8997 (89.97%)** | 0.8985 (89.85%) | -0.12% |
| **Validation AUC** | 0.9802 | **0.9873** | **+0.0071 (Improved)** |
| **Validation Precision** | 0.9825 (98.25%) | **0.9893 (98.93%)** | **+0.68% (Improved)** |
| **Validation Recall** | **0.8781 (87.81%)** | 0.8703 (87.03%) | -0.78% (5 cases delta) |
| **Model Selection Decision** | Baseline checkpoint | **Selected as `FINAL_MODEL_PATH`** | Lower loss & superior AUC across thresholds |

---

## 4. Phase 4: Final Held-Out Test Set Evaluation

- **Evaluation Dataset:** `processed_dataset/test` (**880 images**, strictly unseen during all training/tuning phases)
- **Operating Threshold:** $\tau = 0.50$ (A priori fixed; zero post-hoc tuning)
- **Evaluated Model:** `pneumonia_efficientnetb0_finetuned.keras`

### Quantitative Test Set Metrics

| Metric | Score | Clinical Interpretation |
|---|---|---|
| **Accuracy** | **91.36%** (804 / 880) | Overall correct classification rate |
| **Precision (PPV)** | **98.46%** (575 / 584) | Of all positive predictions, 98.46% actually have pneumonia |
| **Recall / Sensitivity** | **89.56%** (575 / 642) | Detects ~9 out of every 10 pneumonia cases |
| **Specificity (TNR)** | **96.22%** (229 / 238) | Accurately identifies 96.22% of healthy normal lungs |
| **F1-Score** | **0.9380** | Harmonic mean of precision and recall |
| **ROC-AUC** | **0.9873** | Near-perfect class separability across arbitrary cutoffs |

### Test Confusion Matrix

```
                      PREDICTED NORMAL    PREDICTED PNEUMONIA    TOTAL
ACTUAL NORMAL               229 (TN)             9 (FP)           238
ACTUAL PNEUMONIA             67 (FN)           575 (TP)           642
TOTAL                       296                584                880
```

- **False Negatives (67 cases):** The most clinically critical category. 67 patients with pulmonary infiltrates were labeled normal. In clinical practice, decision-support tools pair this probability with a lower threshold or radiologist second-look protocol.
- **False Positives (9 cases):** Extremely low false alarm rate (3.78%), avoiding unnecessary antibiotic exposure or clinical workload overload.

---

## 5. Artifacts & Reproducibility Directory Map

- Model Checkpoint: `pneumonia_efficientnetb0_finetuned.keras`
- Training Stage 1 History: `training_history_stage1.json`
- Training Stage 2 History: `training_history_stage2.json`
- Test Evaluation Summary: `test_evaluation_results.json`
- Plots:
  - `plots/accuracy_finetune.png`
  - `plots/loss_finetune.png`
  - `plots/confusion_matrix.png`
  - `plots/roc_curve.png`
- Explainability Outputs:
  - `gradcam_outputs/*_triplet.png`
