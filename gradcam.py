"""
gradcam.py
Phase 5 — Grad-CAM Explainability for AI Pneumonia Detection

Implements Gradient-weighted Class Activation Mapping (Grad-CAM) to visualize
the decision regions of the trained EfficientNetB0 model.

Important Note:
"The heatmap visualizes image regions that contributed to the model's prediction.
It does not prove, confirm, or replace medical pathology findings."
"""

import os
import cv2
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import tensorflow as tf

from utils import (
    FINAL_MODEL_PATH,
    PROJECT_ROOT,
    TEST_DIR,
    CLASS_NAMES,
    DECISION_THRESHOLD,
    load_final_model,
    preprocess_pil_image,
)

# Output directory for Grad-CAM visualizations
GRADCAM_OUTPUT_DIR = os.path.join(PROJECT_ROOT, "gradcam_outputs")
os.makedirs(GRADCAM_OUTPUT_DIR, exist_ok=True)


def verify_target_conv_layer(model, layer_name="top_conv"):
    """
    Verifies that the target convolutional layer exists in the model's
    EfficientNetB0 base rather than assuming from memory.
    """
    try:
        base_model = model.get_layer("efficientnetb0")
    except ValueError:
        raise ValueError("Could not find 'efficientnetb0' sub-model inside the model.")

    matching = [l for l in base_model.layers if l.name == layer_name]
    if not matching:
        conv_layers = [l.name for l in base_model.layers if "conv" in l.name]
        raise ValueError(
            f"Layer '{layer_name}' not found. Available conv layers: {conv_layers[-5:]}"
        )
    return matching[0]


def generate_gradcam_heatmap(model, pil_img, target_conv_layer_name="top_conv"):
    """
    Computes the Grad-CAM heatmap for a single PIL image using tf.GradientTape.

    Returns:
        heatmap: 2D numpy array (224, 224) with values in [0, 1]
        pred_prob: float (0-1), probability of Pneumonia
        pred_label: str, 'NORMAL' or 'PNEUMONIA'
        pred_idx: int, 0 or 1
        confidence: float (0-100%)
    """
    # 1. Verify conv layer
    _ = verify_target_conv_layer(model, target_conv_layer_name)
    base_model = model.get_layer("efficientnetb0")
    conv_layer = base_model.get_layer(target_conv_layer_name)

    # 2. Extract intermediate and classifier components
    conv_model = tf.keras.Model(base_model.inputs, conv_layer.output)
    top_bn = base_model.get_layer("top_bn")
    top_act = base_model.get_layer("top_activation")
    gap = model.get_layer("global_average_pooling2d")
    dense = model.get_layer("dense")

    # 3. Preprocess image
    input_tensor = preprocess_pil_image(pil_img)

    # 4. Gradient computation with GradientTape
    with tf.GradientTape() as tape:
        conv_outputs = conv_model(input_tensor)
        tape.watch(conv_outputs)

        # Forward pass from top_conv to final prediction
        x = top_bn(conv_outputs, training=False)
        x = top_act(x)
        x = gap(x)
        preds = dense(x)

        pred_prob = float(preds[0][0])
        pred_idx = 1 if pred_prob >= DECISION_THRESHOLD else 0
        pred_label = CLASS_NAMES[pred_idx]

        # Target class score
        score = preds[:, 0] if pred_idx == 1 else (1.0 - preds[:, 0])

    # 5. Gradients of target class w.r.t. feature map
    grads = tape.gradient(score, conv_outputs)

    # 6. Global average pooling of gradients -> neuron importance weights
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # 7. Weighted combination of feature maps
    cam = tf.reduce_sum(tf.multiply(pooled_grads, conv_outputs[0]), axis=-1)

    # 8. Apply ReLU: focus exclusively on features that positively influenced the prediction
    cam = tf.maximum(cam, 0.0)

    # 9. Normalize heatmap to [0, 1]
    cam_max = tf.reduce_max(cam)
    if cam_max > 0:
        cam = cam / cam_max

    heatmap = cam.numpy()
    heatmap = cv2.resize(heatmap, (224, 224))

    confidence = (pred_prob if pred_idx == 1 else (1.0 - pred_prob)) * 100.0
    return heatmap, pred_prob, pred_label, pred_idx, confidence


def overlay_gradcam(pil_img, heatmap, alpha=0.4, colormap=cv2.COLORMAP_JET):
    """
    Overlays the Grad-CAM heatmap onto the original chest X-ray.
    Returns RGB uint8 image array (224, 224, 3).
    """
    img_rgb = pil_img.convert("RGB").resize((224, 224))
    img_array = np.array(img_rgb, dtype=np.uint8)

    # Convert heatmap [0, 1] to uint8 [0, 255]
    heatmap_uint8 = np.uint8(255 * heatmap)
    heatmap_color = cv2.applyColorMap(heatmap_uint8, colormap)
    heatmap_color_rgb = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

    # Superimpose heatmap onto the original image
    superimposed = cv2.addWeighted(img_array, 1.0 - alpha, heatmap_color_rgb, alpha, 0)
    return img_array, heatmap_color_rgb, superimposed


def run_gradcam_pipeline():
    print("=" * 70)
    print("PHASE 5: GRAD-CAM EXPLAINABILITY PIPELINE")
    print("=" * 70)
    print(f"Loading model: {FINAL_MODEL_PATH}")
    model = load_final_model(FINAL_MODEL_PATH)

    # Verify target conv layer explicitly against the actual architecture
    print("Verifying last convolutional layer...")
    conv_layer = verify_target_conv_layer(model, "top_conv")
    print(f"Verified target conv layer: '{conv_layer.name}' (output shape: {conv_layer.output.shape})")

    # Define the curated test cases (2 normal, 2 pneumonia, misclassified examples)
    test_cases = [
        {
            "case_id": "01_correct_normal_1",
            "true_label": "NORMAL",
            "image_path": os.path.join(TEST_DIR, "NORMAL", "IM-0003-0001.jpeg"),
            "description": "Correctly Predicted NORMAL (True Negative)",
        },
        {
            "case_id": "02_correct_normal_2",
            "true_label": "NORMAL",
            "image_path": os.path.join(TEST_DIR, "NORMAL", "IM-0017-0001.jpeg"),
            "description": "Correctly Predicted NORMAL (True Negative)",
        },
        {
            "case_id": "03_correct_pneumonia_1",
            "true_label": "PNEUMONIA",
            "image_path": os.path.join(TEST_DIR, "PNEUMONIA", "person1004_bacteria_2935.jpeg"),
            "description": "Correctly Predicted PNEUMONIA (True Positive)",
        },
        {
            "case_id": "04_correct_pneumonia_2",
            "true_label": "PNEUMONIA",
            "image_path": os.path.join(TEST_DIR, "PNEUMONIA", "person100_bacteria_481.jpeg"),
            "description": "Correctly Predicted PNEUMONIA (True Positive)",
        },
        {
            "case_id": "05_misclassified_FN",
            "true_label": "PNEUMONIA",
            "image_path": os.path.join(TEST_DIR, "PNEUMONIA", "person1030_virus_1722.jpeg"),
            "description": "Misclassified: True PNEUMONIA Predicted as NORMAL (False Negative)",
        },
        {
            "case_id": "06_misclassified_FP",
            "true_label": "NORMAL",
            "image_path": os.path.join(TEST_DIR, "NORMAL", "IM-0010-0001.jpeg"),
            "description": "Misclassified: True NORMAL Predicted as PNEUMONIA (False Positive)",
        },
    ]

    print(f"\nProcessing {len(test_cases)} sample cases for Grad-CAM outputs...")

    for case in test_cases:
        path = case["image_path"]
        case_id = case["case_id"]
        true_label = case["true_label"]
        desc = case["description"]

        if not os.path.exists(path):
            print(f"Skipping {case_id}: File not found at {path}")
            continue

        pil_img = Image.open(path)
        heatmap, prob, pred_label, pred_idx, conf = generate_gradcam_heatmap(model, pil_img)
        orig_arr, hm_color, overlay_arr = overlay_gradcam(pil_img, heatmap)

        # Save triplet plot
        fig, axes = plt.subplots(1, 3, figsize=(14, 5))
        axes[0].imshow(orig_arr)
        axes[0].set_title(f"Original X-Ray\nTrue: {true_label}", fontsize=11, fontweight="bold")
        axes[0].axis("off")

        im_hm = axes[1].imshow(heatmap, cmap="jet")
        axes[1].set_title("Grad-CAM Heatmap\n(Activation Intensity)", fontsize=11, fontweight="bold")
        axes[1].axis("off")
        fig.colorbar(im_hm, ax=axes[1], fraction=0.046, pad=0.04)

        axes[2].imshow(overlay_arr)
        axes[2].set_title(f"Grad-CAM Overlay\nPred: {pred_label} ({conf:.1f}%)", fontsize=11, fontweight="bold")
        axes[2].axis("off")

        # Mandatory clinical framing disclaimer
        fig.suptitle(
            f"Case: {desc}\n"
            "Note: The heatmap visualizes image regions that contributed to the model's prediction.",
            fontsize=11,
            y=0.98,
        )
        plt.tight_layout()

        triplet_path = os.path.join(GRADCAM_OUTPUT_DIR, f"{case_id}_triplet.png")
        plt.savefig(triplet_path, dpi=200, bbox_inches="tight")
        plt.close()

        # Save standalone images
        Image.fromarray(orig_arr).save(os.path.join(GRADCAM_OUTPUT_DIR, f"{case_id}_original.png"))
        Image.fromarray(hm_color).save(os.path.join(GRADCAM_OUTPUT_DIR, f"{case_id}_heatmap.png"))
        Image.fromarray(overlay_arr).save(os.path.join(GRADCAM_OUTPUT_DIR, f"{case_id}_overlay.png"))

        print(f"[{case_id}] True: {true_label:<9} | Pred: {pred_label:<9} ({conf:.1f}%) -> Saved: {triplet_path}")

    print("\n" + "=" * 70)
    print("Grad-CAM generation complete! All outputs saved to:")
    print(f"  {GRADCAM_OUTPUT_DIR}")
    print("=" * 70)


if __name__ == "__main__":
    run_gradcam_pipeline()
