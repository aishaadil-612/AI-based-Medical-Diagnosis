"""
utils.py
Shared utilities for AI Pneumonia Detection System.
Centralizes preprocessing, model paths, and prediction logic
to prevent any silent drift between evaluation, Grad-CAM, and the Streamlit app.
"""

import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input

# ==========================================
# 1. PROJECT PATHS & SETTINGS
# ==========================================
POSSIBLE_ROOTS = [
    r"D:\Aisha\XAI-Pneumonia\AI-based-Medical-Diagnosis",
    r"C:\Users\NIDS\OneDrive\Desktop\xai",
    os.path.dirname(os.path.abspath(__file__)),
]
PROJECT_ROOT = next((p for p in POSSIBLE_ROOTS if os.path.exists(p)), POSSIBLE_ROOTS[0])

DATASET_ROOT = os.path.join(PROJECT_ROOT, "processed_dataset")
TEST_DIR = os.path.join(DATASET_ROOT, "test")
PLOTS_DIR = os.path.join(PROJECT_ROOT, "plots")
os.makedirs(PLOTS_DIR, exist_ok=True)

# Winner of Stage 2 fine-tuning (best val_loss: 0.2295, best val_auc: 0.9873)
STAGE1_MODEL_PATH = os.path.join(PROJECT_ROOT, "pneumonia_efficientnetb0.keras")
STAGE2_MODEL_PATH = os.path.join(PROJECT_ROOT, "pneumonia_efficientnetb0_finetuned.keras")

# Use Stage 2 fine-tuned model if present, otherwise Stage 1
if os.path.exists(STAGE2_MODEL_PATH):
    FINAL_MODEL_PATH = STAGE2_MODEL_PATH
else:
    FINAL_MODEL_PATH = STAGE1_MODEL_PATH

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
CLASS_NAMES = ["NORMAL", "PNEUMONIA"]
CLASS_INDICES = {"NORMAL": 0, "PNEUMONIA": 1}
DECISION_THRESHOLD = 0.5


def load_final_model(model_path=None):
    """Loads the trained model from FINAL_MODEL_PATH."""
    target_path = model_path or FINAL_MODEL_PATH
    if not os.path.exists(target_path):
        raise FileNotFoundError(f"Model file not found at: {target_path}")
    return tf.keras.models.load_model(target_path)


def preprocess_pil_image(pil_img):
    """
    Standard preprocessing for a single image:
    1. Convert to RGB
    2. Resize to (224, 224)
    3. Convert to float32 numpy array [0, 255]
    4. Apply EfficientNet preprocess_input (DO NOT manually divide by 255)
    5. Add batch dimension -> shape (1, 224, 224, 3)
    """
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")
    pil_img = pil_img.resize(IMG_SIZE)
    img_array = np.array(pil_img, dtype=np.float32)
    img_preprocessed = preprocess_input(img_array)
    return np.expand_dims(img_preprocessed, axis=0)


def predict_single_image(model, pil_img):
    """
    Runs inference on a single PIL image using the standard pipeline.
    Returns:
        prob: float, probability of Pneumonia (class 1)
        pred_label: str, 'NORMAL' or 'PNEUMONIA'
        pred_idx: int, 0 or 1
        confidence: float, confidence percentage (0-100%)
    """
    input_tensor = preprocess_pil_image(pil_img)
    pred_raw = model.predict(input_tensor, verbose=0)
    prob = float(pred_raw[0][0])
    pred_idx = 1 if prob >= DECISION_THRESHOLD else 0
    pred_label = CLASS_NAMES[pred_idx]
    confidence = (prob if pred_idx == 1 else (1.0 - prob)) * 100.0
    return prob, pred_label, pred_idx, confidence
