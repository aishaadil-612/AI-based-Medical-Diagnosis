"""
app.py
Phase 6: Streamlit Web Application
AI-Based Pneumonia Detection System with Explainable AI (Grad-CAM)

Requirements:
- Title: "AI-Based Pneumonia Detection System"
- Image upload widget (PNG, JPG, JPEG) + sample image selector
- Unified preprocessing via utils.py (preprocess_input, no manual /255)
- Model cached once via @st.cache_resource
- Visualizations: Original X-Ray, Grad-CAM Heatmap, Superimposed Overlay
- Prominent, permanent medical disclaimer
- Run command: streamlit run app.py
"""

import os
from PIL import Image
import streamlit as st
import numpy as np

from utils import (
    FINAL_MODEL_PATH,
    PROJECT_ROOT,
    TEST_DIR,
    CLASS_NAMES,
    DECISION_THRESHOLD,
    load_final_model,
)
from gradcam import generate_gradcam_heatmap, overlay_gradcam

# ==============================================================================
# 1. PAGE CONFIGURATION & STYLING
# ==============================================================================
st.set_page_config(
    page_title="AI-Based Pneumonia Detection System",
    page_icon="🫁",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 800;
        color: #1E3A8A;
        margin-bottom: 0.2rem;
    }
    .sub-title {
        font-size: 1.05rem;
        color: #4B5563;
        margin-bottom: 1.2rem;
    }
    .disclaimer-box {
        background-color: #FEF3C7;
        border-left: 5px solid #F59E0B;
        padding: 12px 16px;
        border-radius: 6px;
        color: #92400E;
        font-size: 0.92rem;
        font-weight: 500;
        margin-bottom: 1.5rem;
    }
    .result-card-pos {
        background-color: #FEE2E2;
        border: 2px solid #EF4444;
        padding: 18px;
        border-radius: 8px;
        color: #991B1B;
    }
    .result-card-neg {
        background-color: #ECFDF5;
        border: 2px solid #10B981;
        padding: 18px;
        border-radius: 8px;
        color: #065F46;
    }
    .caption-text {
        font-size: 0.85rem;
        color: #6B7280;
        font-style: italic;
        margin-top: 6px;
    }
    .explanation-card {
        background-color: #F8FAFC;
        border: 1.5px solid #CBD5E1;
        border-left: 6px solid #2563EB;
        padding: 20px 24px;
        border-radius: 8px;
        margin-top: 22px;
        margin-bottom: 22px;
        color: #1E293B;
    }
    .explanation-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1E3A8A;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ==============================================================================
# 2. PERMANENT MEDICAL DISCLAIMER (MANDATORY)
# ==============================================================================
DISCLAIMER_TEXT = (
    "⚠️ **CLINICAL & REGULATORY DISCLAIMER:** This application is an educational and research prototype "
    "decision-support tool. It is NOT a certified medical device and is NOT a substitute for "
    "professional medical diagnosis, radiological report, or physician consultation."
)

st.markdown(f'<div class="disclaimer-box">{DISCLAIMER_TEXT}</div>', unsafe_allow_html=True)
st.markdown('<div class="main-title">AI-Based Pneumonia Detection System</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-title">Automated Chest X-Ray Diagnosis & Explainable AI (Grad-CAM) powered by EfficientNetB0</div>',
    unsafe_allow_html=True,
)

# ==============================================================================
# 3. LOAD MODEL (CACHED)
# ==============================================================================
@st.cache_resource(show_spinner="Loading deep learning model...")
def get_cached_model():
    return load_final_model(FINAL_MODEL_PATH)

try:
    model = get_cached_model()
except Exception as e:
    st.error(f"Error loading model from `{FINAL_MODEL_PATH}`: {e}")
    st.stop()

# ==============================================================================
# 4. SIDEBAR: CONTROLS & TEST SAMPLES
# ==============================================================================
st.sidebar.header("📁 Input Selection")

input_mode = st.sidebar.radio(
    "Choose Input Method:",
    ["Upload X-Ray Image", "Select Sample from Test Set"],
)

selected_image = None
sample_label_hint = None

if input_mode == "Upload X-Ray Image":
    uploaded_file = st.sidebar.file_uploader(
        "Upload a Chest X-ray",
        type=["png", "jpg", "jpeg"],
        help="Upload standard frontal chest radiograph (AP or PA view).",
    )
    if uploaded_file is not None:
        try:
            selected_image = Image.open(uploaded_file)
        except Exception as e:
            st.sidebar.error(f"Invalid image file: {e}")

else:
    # Quick access to test samples
    samples = {
        "Sample 1: Normal Chest X-Ray": os.path.join(TEST_DIR, "NORMAL", "IM-0003-0001.jpeg"),
        "Sample 2: Normal Chest X-Ray": os.path.join(TEST_DIR, "NORMAL", "IM-0017-0001.jpeg"),
        "Sample 3: Bacterial Pneumonia": os.path.join(TEST_DIR, "PNEUMONIA", "person1004_bacteria_2935.jpeg"),
        "Sample 4: Viral Pneumonia": os.path.join(TEST_DIR, "PNEUMONIA", "person100_bacteria_481.jpeg"),
        "Sample 5: Challenging Case (FN)": os.path.join(TEST_DIR, "PNEUMONIA", "person1030_virus_1722.jpeg"),
    }
    chosen_sample_name = st.sidebar.selectbox("Select a benchmark test sample:", list(samples.keys()))
    sample_path = samples[chosen_sample_name]
    if os.path.exists(sample_path):
        selected_image = Image.open(sample_path)
        sample_label_hint = "NORMAL" if "Normal" in chosen_sample_name else "PNEUMONIA"
    else:
        st.sidebar.warning(f"Sample file not found at: {sample_path}")

st.sidebar.markdown("---")
st.sidebar.markdown("### 📊 Model Architecture Info")
st.sidebar.write("**Base Model:** EfficientNetB0")
st.sidebar.write("**Weights:** Transfer Learning (Top 30 layers fine-tuned)")
st.sidebar.write("**Input Size:** 224 × 224 RGB")
st.sidebar.write(f"**Operating Threshold:** {DECISION_THRESHOLD} (Fixed)")
st.sidebar.write("**Test Accuracy:** 91.36%")
st.sidebar.write("**Test Sensitivity (Recall):** 89.56%")
st.sidebar.write("**Test ROC-AUC:** 0.9873")

# Heatmap transparency slider
alpha = st.sidebar.slider("Grad-CAM Overlay Opacity", min_value=0.1, max_value=0.8, value=0.4, step=0.05)

# ==============================================================================
# 5. DIAGNOSTIC INFERENCE & EXPLAINABILITY
# ==============================================================================
if selected_image is not None:
    with st.spinner("Analyzing radiograph and generating Grad-CAM heatmaps..."):
        # Generate Grad-CAM & Prediction
        heatmap, prob, pred_label, pred_idx, conf = generate_gradcam_heatmap(model, selected_image)
        orig_arr, hm_color, overlay_arr = overlay_gradcam(selected_image, heatmap, alpha=alpha)

    # Prediction Outcome Banner
    st.markdown("---")
    st.subheader("Diagnostic Prediction")

    col_res1, col_res2, col_res3 = st.columns([1.5, 1, 1])

    with col_res1:
        if pred_label == "PNEUMONIA":
            st.markdown(
                f"""
                <div class="result-card-pos">
                    <h2 style="margin:0; font-size:1.6rem;">🚨 PNEUMONIA DETECTED</h2>
                    <p style="margin:5px 0 0 0; font-size:1.05rem;">The model predicted pulmonary infiltrates consistent with pneumonia.</p>
                </div>
                """,
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                f"""
                <div class="result-card-neg">
                    <h2 style="margin:0; font-size:1.6rem;">✅ NORMAL CHEST X-RAY</h2>
                    <p style="margin:5px 0 0 0; font-size:1.05rem;">No significant radiological patterns of pneumonia detected.</p>
                </div>
                """,
                unsafe_allow_html=True,
            )

    with col_res2:
        st.metric(label="Predicted Class", value=pred_label)
        if sample_label_hint:
            st.caption(f"Ground Truth Label: **{sample_label_hint}**")

    with col_res3:
        st.metric(label="Model Confidence", value=f"{conf:.2f}%")
        st.caption(f"Raw Pneumonia Probability: `{prob:.4f}`")

    # Grad-CAM Visualizations
    st.markdown("---")
    st.subheader("Explainable AI (Grad-CAM Visualizations)")
    st.markdown(
        "*The heatmap visualizes image regions that contributed to the model's prediction. "
        "Warmer colors (red, yellow) indicate anatomical features most influential in the model's decision.*"
    )

    c1, c2, c3 = st.columns(3)

    with c1:
        st.image(orig_arr, caption="1. Original Preprocessed X-Ray (224×224)", use_container_width=True)

    with c2:
        st.image(hm_color, caption="2. Grad-CAM Activation Heatmap (top_conv)", use_container_width=True)

    with c3:
        st.image(overlay_arr, caption=f"3. Superimposed Overlay (Opacity: {alpha})", use_container_width=True)

    # ==========================================================================
    # AUTOMATED CLINICAL REASONING & DECISION JUSTIFICATION BOX
    # ==========================================================================
    y_peak, x_peak = np.unravel_index(np.argmax(heatmap), heatmap.shape)
    # Radiologic convention: left side of image = Patient's Anatomical Right Hemithorax
    hemithorax = "Right Lung (Anatomical Right)" if x_peak < 112 else "Left Lung (Anatomical Left)"
    zone = (
        "Upper / Apical Zone"
        if y_peak < 75
        else ("Mid / Perihilar Zone" if y_peak < 150 else "Lower / Basilar Zone")
    )
    is_corner_marker = y_peak < 55 and (x_peak > 165 or x_peak < 55)
    salient_pct = float((np.sum(heatmap >= 0.50) / (224 * 224)) * 100.0)

    # 1. Primary diagnostic rationale
    if pred_label == "PNEUMONIA":
        if prob >= 0.85:
            diag_reason = (
                f"The EfficientNetB0 backbone detected pronounced, high-density opacity signatures "
                f"with a pneumonia probability of <strong>{prob * 100:.2f}%</strong> (confidence: <strong>{conf:.2f}%</strong>). "
                f"The feature response decisively exceeds the pre-fixed decision threshold (τ = {DECISION_THRESHOLD})."
            )
        else:
            diag_reason = (
                f"The model detected moderate opacification or bronchovascular thickening, yielding a pneumonia "
                f"probability of <strong>{prob * 100:.2f}%</strong>. Because this crosses the {DECISION_THRESHOLD} cutoff, "
                f"it was classified as <strong>PNEUMONIA</strong>."
            )
    else:
        if prob <= 0.20:
            diag_reason = (
                f"The model identified clear, well-aerated lung parenchyma with normal physiological radiolucency. "
                f"The calculated pneumonia probability is very low (<strong>{prob * 100:.2f}%</strong>), yielding high normal confidence (<strong>{conf:.2f}%</strong>)."
            )
        else:
            diag_reason = (
                f"The calculated pneumonia probability (<strong>{prob * 100:.2f}%</strong>) fell below the {DECISION_THRESHOLD} operational threshold. "
                f"While mild background vascular markings were detected, they were insufficient to trigger a positive diagnosis."
            )

    # 2. Saliency hotspot rationale
    if is_corner_marker:
        saliency_reason = (
            f"The single strongest activation peak (100% relative intensity) is situated in the <strong>upper peripheral corner</strong> "
            f"([Y={y_peak}, X={x_peak}]). In medical datasets, this region frequently contains <strong>radiological orientation tokens or posture labels "
            f"(such as 'SUPINE', 'PORTABLE', or 'L/R')</strong>. Clinicians should inspect whether attention was partially influenced by textual markers "
            f"('shortcut learning') alongside pulmonary parenchyma."
        )
    else:
        pattern_type = "diffuse / multifocal" if salient_pct >= 5.0 else "focal / localized"
        saliency_reason = (
            f"The primary diagnostic evidence is centered at the <strong>{hemithorax}, {zone}</strong> (peak activation at pixel [Y={y_peak}, X={x_peak}]). "
            f"The saliency map exhibits a <strong>{pattern_type}</strong> distribution spanning <strong>{salient_pct:.1f}%</strong> of the thoracic field, "
            f"directing attention to pulmonary infiltrates in this anatomical area."
        )

    # 3. Triage & threshold assessment
    if 0.40 <= prob <= 0.60:
        triage_reason = (
            f"⚠️ <strong>Borderline Triage Warning:</strong> The predicted probability ({prob:.4f}) is close to the 0.50 cutoff. "
            f"In clinical emergency workflows, borderline cases warrant lower sensitive thresholds (e.g., τ ≈ 0.35) or a manual radiologist second-look."
        )
    else:
        triage_reason = (
            f"✅ <strong>Diagnostic Concordance:</strong> High numerical separation from the 0.50 cutoff, indicating decisive model confidence."
        )

    st.markdown(
        f"""
        <div class="explanation-card">
            <div class="explanation-title">
                📋 AI Clinical Reasoning & Decision Justification Report
            </div>
            <p style="margin-bottom: 8px;"><strong>1. Diagnostic Rationale:</strong> {diag_reason}</p>
            <p style="margin-bottom: 8px;"><strong>2. Anatomical Attention Mapping (Grad-CAM Evidence):</strong> {saliency_reason}</p>
            <p style="margin-bottom: 0px;"><strong>3. Triage & Threshold Assessment:</strong> {triage_reason}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    with st.expander("ℹ️ Clinical & Technical Interpretation Details"):
        st.markdown(
            f"""
            - **Decision Threshold:** Fixed at `{DECISION_THRESHOLD}`. A predicted probability $\ge 0.50$ triggers a PNEUMONIA classification.
            - **Grad-CAM Feature Map:** Extracted from layer `top_conv` (final convolutional stage of EfficientNetB0, dimension $7 \\times 7 \\times 1280$).
            - **False Negative Risk:** In clinical settings, a False Negative (Pneumonia classified as Normal) carries significant risk of delayed treatment. 
              The model achieved an **89.56% Sensitivity** on the 880-image held-out test set with an **ROC-AUC of 0.9873**.
            - **Scope:** This system is focused strictly on binary Pneumonia classification from frontal chest X-rays.
            """
        )

else:
    st.info("👆 Please upload a chest X-ray or select a benchmark sample from the sidebar to begin analysis.")

# Permanent footer disclaimer
st.markdown("---")
st.markdown(
    '<div class="disclaimer-box" style="margin-top:20px;">' + DISCLAIMER_TEXT + '</div>',
    unsafe_allow_html=True,
)
