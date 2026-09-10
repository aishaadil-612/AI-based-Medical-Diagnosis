"""
evaluate_model.py
Phase 4: Model Evaluation on the Held-Out Test Set

Rules enforced:
- Evaluates FINAL_MODEL_PATH strictly on processed_dataset/test (880 images).
- Uses shuffle=False and identical preprocessing (preprocess_input).
- Classification threshold fixed at 0.5 in advance (not tuned against test data).
- Computes Accuracy, Precision, Recall (Sensitivity), Specificity, F1, and ROC-AUC.
- Generates and saves plots/confusion_matrix.png and plots/roc_curve.png.
"""

import os
import json
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    roc_curve,
    auc,
    roc_auc_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.efficientnet import preprocess_input

from utils import (
    FINAL_MODEL_PATH,
    TEST_DIR,
    IMG_SIZE,
    BATCH_SIZE,
    PLOTS_DIR,
    DECISION_THRESHOLD,
    load_final_model,
)

def evaluate():
    print("=" * 70)
    print("PHASE 4: HELD-OUT TEST SET EVALUATION")
    print("=" * 70)
    print(f"Model Path: {FINAL_MODEL_PATH}")
    print(f"Test Set Directory: {TEST_DIR}")
    print(f"Decision Threshold: {DECISION_THRESHOLD} (Fixed in advance)")
    print("-" * 70)

    # 1. Load Model
    print("\n1. Loading model...")
    model = load_final_model(FINAL_MODEL_PATH)
    print("Model loaded successfully.")

    # 2. Test Data Generator
    # Preprocessing MUST be identical to training (preprocess_input, NOT /255)
    test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

    test_generator = test_datagen.flow_from_directory(
        TEST_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="binary",
        shuffle=False,  # Essential: preserve order for label alignment
    )

    total_test_samples = test_generator.samples
    print(f"Total test samples found: {total_test_samples}")
    print(f"Class indices: {test_generator.class_indices}")

    if total_test_samples != 880:
        print(f"WARNING: Expected 880 images, found {total_test_samples}!")

    # 3. Predict Probabilities
    print("\n2. Generating predictions on the held-out test set...")
    raw_preds = model.predict(test_generator, verbose=1)
    y_probs = raw_preds.ravel()
    y_true = test_generator.classes

    # Binary decisions based on pre-fixed 0.5 threshold
    y_pred = (y_probs >= DECISION_THRESHOLD).astype(int)

    # 4. Compute Metrics
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred)
    recall = recall_score(y_true, y_pred)       # Sensitivity
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    f1 = f1_score(y_true, y_pred)
    roc_auc = roc_auc_score(y_true, y_probs)

    print("\n" + "=" * 70)
    print("TEST SET EVALUATION RESULTS")
    print("=" * 70)
    print(f"Accuracy:    {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"Precision:   {precision:.4f} ({precision * 100:.2f}%)")
    print(f"Recall (Sensitivity): {recall:.4f} ({recall * 100:.2f}%)")
    print(f"Specificity: {specificity:.4f} ({specificity * 100:.2f}%)")
    print(f"F1-Score:    {f1:.4f}")
    print(f"ROC-AUC:     {roc_auc:.4f}")
    print("-" * 70)
    print("\nConfusion Matrix Breakdown:")
    print(f"  True Negatives  (NORMAL correctly classified):    {tn}")
    print(f"  False Positives (NORMAL predicted as PNEUMONIA): {fp}")
    print(f"  False Negatives (PNEUMONIA predicted as NORMAL): {fn}  <-- CLINICALLY CRITICAL")
    print(f"  True Positives  (PNEUMONIA correctly classified): {tp}")
    print("-" * 70)

    print("\nFull Classification Report:")
    target_names = ["NORMAL (Class 0)", "PNEUMONIA (Class 1)"]
    print(classification_report(y_true, y_pred, target_names=target_names, digits=4))

    # 5. Clinical & Technical Explanations
    print("=" * 70)
    print("CLINICAL & METHODOLOGICAL INTERPRETATION")
    print("=" * 70)
    print(
        "1. CLINICAL SIGNIFICANCE OF FALSE NEGATIVES:\n"
        f"   - In this test set, the model yielded {fn} False Negatives out of {tp + fn} total Pneumonia patients.\n"
        "   - A False Negative means a patient WITH pneumonia was falsely classified as NORMAL.\n"
        "   - Clinically, this is the most perilous error: an untreated pulmonary infection can rapidly escalate\n"
        "     to respiratory failure, sepsis, and death. In contrast, False Positives ({fp}) prompt harmless confirmatory\n"
        "     follow-ups or radiologist reviews."
    )
    print(
        "\n2. ROC-AUC SEPARABILITY:\n"
        f"   - The test ROC-AUC is {roc_auc:.4f}.\n"
        "   - ROC-AUC measures the probability that the model assigns a higher pneumonia score to a randomly\n"
        "     chosen pneumonia X-ray than to a randomly chosen healthy X-ray, across ALL possible thresholds.\n"
        "   - An AUC near 1.0 demonstrates intrinsic diagnostic discrimination, completely separate from the 0.5 operating cut-off."
    )
    print(
        "\n3. DECISION THRESHOLD RIGOR:\n"
        f"   - The threshold was fixed at {DECISION_THRESHOLD} prior to evaluation.\n"
        "   - It was NOT post-hoc optimized or tuned against the test set, guaranteeing zero test set leakage."
    )
    print("=" * 70)

    # 6. Plot & Save Confusion Matrix
    plt.figure(figsize=(6, 5))
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    plt.title("Confusion Matrix — Held-Out Test Set (N=880)", fontsize=12, fontweight="bold", pad=12)
    plt.colorbar()
    tick_marks = np.arange(len(target_names))
    plt.xticks(tick_marks, ["NORMAL", "PNEUMONIA"], fontsize=10)
    plt.yticks(tick_marks, ["NORMAL", "PNEUMONIA"], fontsize=10)

    # Annotate counts inside boxes
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            count = cm[i, j]
            pct = (count / cm[i].sum()) * 100
            plt.text(
                j,
                i,
                f"{count}\n({pct:.1f}%)",
                horizontalalignment="center",
                verticalalignment="center",
                color="white" if count > thresh else "black",
                fontsize=11,
                fontweight="bold",
            )

    plt.ylabel("True Diagnosis", fontsize=11, fontweight="bold")
    plt.xlabel("Predicted Diagnosis", fontsize=11, fontweight="bold")
    plt.tight_layout()
    cm_path = os.path.join(PLOTS_DIR, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f"\n[Saved] Confusion matrix plot -> {cm_path}")

    # 7. Plot & Save ROC Curve
    fpr, tpr, thresholds = roc_curve(y_true, y_probs)
    roc_auc_val = auc(fpr, tpr)

    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, color="#1f77b4", lw=2.5, label=f"EfficientNetB0 (AUC = {roc_auc_val:.4f})")
    plt.plot([0, 1], [0, 1], color="grey", lw=1.5, linestyle="--", label="Random Chance (AUC = 0.5000)")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate (1 - Specificity)", fontsize=11, fontweight="bold")
    plt.ylabel("True Positive Rate (Sensitivity / Recall)", fontsize=11, fontweight="bold")
    plt.title("Receiver Operating Characteristic (ROC) Curve", fontsize=12, fontweight="bold", pad=12)
    plt.legend(loc="lower right", fontsize=10)
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.tight_layout()
    roc_path = os.path.join(PLOTS_DIR, "roc_curve.png")
    plt.savefig(roc_path, dpi=300)
    plt.close()
    print(f"[Saved] ROC curve plot -> {roc_path}")

    # 8. Save test results to JSON
    results = {
        "final_model_path": FINAL_MODEL_PATH,
        "test_samples": total_test_samples,
        "threshold": DECISION_THRESHOLD,
        "metrics": {
            "accuracy": round(float(accuracy), 4),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "specificity": round(float(specificity), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc_auc), 4),
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
        },
    }
    results_path = os.path.join(os.path.dirname(FINAL_MODEL_PATH), "test_evaluation_results.json")
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"[Saved] Evaluation metrics JSON -> {results_path}")

if __name__ == "__main__":
    evaluate()
