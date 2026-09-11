"""
backend/api.py
FastAPI REST API wrapping the existing Python inference pipeline.

This module exposes the trained EfficientNetB0 model and Grad-CAM explainability
engine through HTTP endpoints consumed by the Pneumora React frontend.
No ML logic is reimplemented here — every computation delegates to utils.py,
gradcam.py, and the clinical-reasoning logic originally in app.py.

Run:
    cd backend && uvicorn api:app --reload --port 8000
"""

import os
import sys
import json
import base64
import io

import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

# ---------------------------------------------------------------------------
# Ensure the parent directory (project root) is on sys.path so we can import
# utils.py, gradcam.py etc. that live alongside app.py.
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from utils import (
    FINAL_MODEL_PATH,
    TEST_DIR,
    CLASS_NAMES,
    DECISION_THRESHOLD,
    load_final_model,
)
from gradcam import generate_gradcam_heatmap, overlay_gradcam

# ===========================================================================
# App & CORS
# ===========================================================================
app = FastAPI(
    title="Pneumora API",
    description="AI-Based Pneumonia Detection — inference & explainability API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================================================================
# Model Loading (once at startup, mirrors @st.cache_resource)
# ===========================================================================
print(f"[Pneumora API] Loading model from: {FINAL_MODEL_PATH}")
model = load_final_model(FINAL_MODEL_PATH)
print("[Pneumora API] Model loaded successfully.")


# ===========================================================================
# Helpers
# ===========================================================================
def _ndarray_to_base64(arr: np.ndarray) -> str:
    """Convert a uint8 numpy image array to a base64-encoded PNG string."""
    img = Image.fromarray(arr)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _compute_clinical_reasoning(
    heatmap: np.ndarray,
    prob: float,
    pred_label: str,
    conf: float,
) -> dict:
    """
    Exact clinical-reasoning logic from app.py lines 261-323.
    Returns hemithorax, zone, salient_pct, diag_reason, saliency_reason,
    triage_reason — unchanged in semantics.
    """
    y_peak, x_peak = np.unravel_index(np.argmax(heatmap), heatmap.shape)

    # Radiologic convention: left side of image = Patient's Anatomical Right
    hemithorax = (
        "Right Lung (Anatomical Right)" if x_peak < 112
        else "Left Lung (Anatomical Left)"
    )
    zone = (
        "Upper / Apical Zone" if y_peak < 75
        else ("Mid / Perihilar Zone" if y_peak < 150 else "Lower / Basilar Zone")
    )
    is_corner_marker = y_peak < 55 and (x_peak > 165 or x_peak < 55)
    salient_pct = float((np.sum(heatmap >= 0.50) / (224 * 224)) * 100.0)

    # 1. Primary diagnostic rationale
    if pred_label == "PNEUMONIA":
        if prob >= 0.85:
            diag_reason = (
                f"The EfficientNetB0 backbone detected pronounced, high-density opacity signatures "
                f"with a pneumonia probability of {prob * 100:.2f}% (confidence: {conf:.2f}%). "
                f"The feature response decisively exceeds the pre-fixed decision threshold "
                f"(\u03c4 = {DECISION_THRESHOLD})."
            )
        else:
            diag_reason = (
                f"The model detected moderate opacification or bronchovascular thickening, "
                f"yielding a pneumonia probability of {prob * 100:.2f}%. Because this crosses "
                f"the {DECISION_THRESHOLD} cutoff, it was classified as PNEUMONIA."
            )
    else:
        if prob <= 0.20:
            diag_reason = (
                f"The model identified clear, well-aerated lung parenchyma with normal "
                f"physiological radiolucency. The calculated pneumonia probability is very low "
                f"({prob * 100:.2f}%), yielding high normal confidence ({conf:.2f}%)."
            )
        else:
            diag_reason = (
                f"The calculated pneumonia probability ({prob * 100:.2f}%) fell below the "
                f"{DECISION_THRESHOLD} operational threshold. While mild background vascular "
                f"markings were detected, they were insufficient to trigger a positive diagnosis."
            )

    # 2. Saliency hotspot rationale
    if is_corner_marker:
        saliency_reason = (
            f"The single strongest activation peak (100% relative intensity) is situated in the "
            f"upper peripheral corner ([Y={y_peak}, X={x_peak}]). In medical datasets, this region "
            f"frequently contains radiological orientation tokens or posture labels (such as "
            f"'SUPINE', 'PORTABLE', or 'L/R'). Clinicians should inspect whether attention was "
            f"partially influenced by textual markers ('shortcut learning') alongside pulmonary "
            f"parenchyma."
        )
    else:
        pattern_type = "diffuse / multifocal" if salient_pct >= 5.0 else "focal / localized"
        saliency_reason = (
            f"The primary diagnostic evidence is centered at the {hemithorax}, {zone} "
            f"(peak activation at pixel [Y={y_peak}, X={x_peak}]). The saliency map exhibits a "
            f"{pattern_type} distribution spanning {salient_pct:.1f}% of the thoracic field, "
            f"directing attention to pulmonary infiltrates in this anatomical area."
        )

    # 3. Triage & threshold assessment
    if 0.40 <= prob <= 0.60:
        triage_reason = (
            f"Borderline Triage Warning: The predicted probability ({prob:.4f}) is close to the "
            f"0.50 cutoff. In clinical emergency workflows, borderline cases warrant lower "
            f"sensitive thresholds (e.g., \u03c4 \u2248 0.35) or a manual radiologist second-look."
        )
    else:
        triage_reason = (
            f"Diagnostic Concordance: High numerical separation from the 0.50 cutoff, "
            f"indicating decisive model confidence."
        )

    return {
        "hemithorax": hemithorax,
        "zone": zone,
        "y_peak": int(y_peak),
        "x_peak": int(x_peak),
        "salient_pct": round(salient_pct, 2),
        "diag_reason": diag_reason,
        "saliency_reason": saliency_reason,
        "triage_reason": triage_reason,
    }


# ===========================================================================
# Endpoints
# ===========================================================================

@app.get("/")
@app.get("/health")
def root():
    return {"status": "ok", "service": "Pneumora API", "model": FINAL_MODEL_PATH}


@app.post("/api/predict")
async def predict(file: UploadFile = File(...), alpha: float = 0.4):
    """
    Run inference + Grad-CAM on an uploaded chest X-ray image.
    Returns all fields required by the Pneumora frontend.
    """
    # Validate file type
    if file.content_type not in ("image/png", "image/jpeg", "image/jpg"):
        raise HTTPException(status_code=400, detail="Only PNG/JPEG images are accepted.")

    try:
        contents = await file.read()
        pil_img = Image.open(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

    # Grad-CAM + prediction (delegates entirely to gradcam.py)
    heatmap, prob, pred_label, pred_idx, conf = generate_gradcam_heatmap(model, pil_img)
    orig_arr, hm_color, overlay_arr = overlay_gradcam(pil_img, heatmap, alpha=alpha)

    # Clinical reasoning (exact logic from app.py)
    reasoning = _compute_clinical_reasoning(heatmap, prob, pred_label, conf)

    return {
        "prob": round(prob, 6),
        "pred_label": pred_label,
        "pred_idx": pred_idx,
        "confidence": round(conf, 2),
        **reasoning,
        "images": {
            "original": _ndarray_to_base64(orig_arr),
            "heatmap": _ndarray_to_base64(hm_color),
            "overlay": _ndarray_to_base64(overlay_arr),
        },
    }


@app.post("/api/predict-sample")
async def predict_sample(sample_key: str, alpha: float = 0.4):
    """
    Run inference on a pre-loaded benchmark test sample.
    sample_key must be one of the keys returned by GET /api/samples.
    """
    samples = _get_sample_map()
    if sample_key not in samples:
        raise HTTPException(status_code=404, detail=f"Unknown sample key: {sample_key}")

    sample = samples[sample_key]
    path = sample["path"]
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Sample file not found: {path}")

    pil_img = Image.open(path)

    heatmap, prob, pred_label, pred_idx, conf = generate_gradcam_heatmap(model, pil_img)
    orig_arr, hm_color, overlay_arr = overlay_gradcam(pil_img, heatmap, alpha=alpha)
    reasoning = _compute_clinical_reasoning(heatmap, prob, pred_label, conf)

    return {
        "prob": round(prob, 6),
        "pred_label": pred_label,
        "pred_idx": pred_idx,
        "confidence": round(conf, 2),
        "ground_truth": sample["label"],
        **reasoning,
        "images": {
            "original": _ndarray_to_base64(orig_arr),
            "heatmap": _ndarray_to_base64(hm_color),
            "overlay": _ndarray_to_base64(overlay_arr),
        },
    }


def _get_sample_map() -> dict:
    """Returns the same benchmark samples defined in app.py."""
    return {
        "normal_1": {
            "name": "Sample 1: Normal Chest X-Ray",
            "path": os.path.join(TEST_DIR, "NORMAL", "IM-0003-0001.jpeg"),
            "label": "NORMAL",
        },
        "normal_2": {
            "name": "Sample 2: Normal Chest X-Ray",
            "path": os.path.join(TEST_DIR, "NORMAL", "IM-0017-0001.jpeg"),
            "label": "NORMAL",
        },
        "pneumonia_bacterial": {
            "name": "Sample 3: Bacterial Pneumonia",
            "path": os.path.join(TEST_DIR, "PNEUMONIA", "person1004_bacteria_2935.jpeg"),
            "label": "PNEUMONIA",
        },
        "pneumonia_viral": {
            "name": "Sample 4: Viral Pneumonia",
            "path": os.path.join(TEST_DIR, "PNEUMONIA", "person100_bacteria_481.jpeg"),
            "label": "PNEUMONIA",
        },
        "challenging_fn": {
            "name": "Sample 5: Challenging Case (FN)",
            "path": os.path.join(TEST_DIR, "PNEUMONIA", "person1030_virus_1722.jpeg"),
            "label": "PNEUMONIA",
        },
    }


@app.get("/api/samples")
def get_samples():
    """List available benchmark test samples."""
    samples = _get_sample_map()
    return {
        key: {"name": val["name"], "label": val["label"], "available": os.path.exists(val["path"])}
        for key, val in samples.items()
    }


@app.get("/api/metrics")
def get_metrics():
    """Return static test evaluation metrics from test_evaluation_results.json."""
    metrics_path = os.path.join(PROJECT_ROOT, "test_evaluation_results.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Metrics file not found.")
    with open(metrics_path, "r") as f:
        return json.load(f)


@app.get("/api/plots/{name}")
def get_plot(name: str):
    """Serve a plot image from the plots/ directory."""
    allowed = ["accuracy_finetune", "loss_finetune", "confusion_matrix", "roc_curve"]
    if name not in allowed:
        raise HTTPException(status_code=404, detail=f"Unknown plot: {name}. Allowed: {allowed}")
    path = os.path.join(PROJECT_ROOT, "plots", f"{name}.png")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Plot file not found: {path}")
    return FileResponse(path, media_type="image/png")


@app.get("/api/training-history")
def get_training_history():
    """Return training history JSON data for both stages."""
    result = {}
    for stage in ["stage1", "stage2"]:
        path = os.path.join(PROJECT_ROOT, f"training_history_{stage}.json")
        if os.path.exists(path):
            with open(path, "r") as f:
                result[stage] = json.load(f)
    if not result:
        raise HTTPException(status_code=404, detail="No training history files found.")
    return result
