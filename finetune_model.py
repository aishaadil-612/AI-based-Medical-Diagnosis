"""
finetune_model.py
Phase 3 — Stage 2: EfficientNetB0 fine-tuning

Loads the ALREADY-TRAINED Stage 1 model (pneumonia_efficientnetb0.keras,
which holds the best Stage 1 weights from epoch 12) and continues
training with the top layers of EfficientNetB0 unfrozen and a much
smaller learning rate. This does NOT redo Stage 1 - it picks up from
the saved checkpoint.

Only the training set and validation set are used here.
processed_dataset/test is still untouched - reserved for evaluate_model.py.
"""

import os
import json
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight

# ==========================================
# 1. PATHS
# ==========================================
POSSIBLE_ROOTS = [
    r"D:\Aisha\XAI-Pneumonia\AI-based-Medical-Diagnosis",
    r"C:\Users\NIDS\OneDrive\Desktop\xai",
    os.path.dirname(os.path.abspath(__file__)),
]
PROJECT_ROOT = next((p for p in POSSIBLE_ROOTS if os.path.exists(p)), POSSIBLE_ROOTS[0])
print(f"Using PROJECT_ROOT: {PROJECT_ROOT}")

DATASET_ROOT = os.path.join(PROJECT_ROOT, "processed_dataset")
TRAIN_DIR = os.path.join(DATASET_ROOT, "train")
VAL_DIR = os.path.join(DATASET_ROOT, "validation")

STAGE1_MODEL_PATH = os.path.join(PROJECT_ROOT, "pneumonia_efficientnetb0.keras")
FT_MODEL_SAVE_PATH = os.path.join(PROJECT_ROOT, "pneumonia_efficientnetb0_finetuned.keras")
FT_HISTORY_SAVE_PATH = os.path.join(PROJECT_ROOT, "training_history_stage2.json")
PLOTS_DIR = os.path.join(PROJECT_ROOT, "plots")
os.makedirs(PLOTS_DIR, exist_ok=True)

# ==========================================
# 2. CONFIG
# ==========================================
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
NUM_LAYERS_TO_UNFREEZE = 30   # unfreeze only the LAST N layers of EfficientNetB0
FT_LEARNING_RATE = 1e-5       # smaller than any LR Stage 1 reached (ended at 4e-5)
FT_EPOCHS = 10

# Stage 1's best result, for comparison when this run finishes.
STAGE1_BEST_VAL_LOSS = 0.2345
STAGE1_BEST_VAL_RECALL = 0.8781

# ==========================================
# 3. DATA GENERATORS (identical to Stage 1)
# ==========================================
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=10,
    width_shift_range=0.10,
    height_shift_range=0.10,
    zoom_range=0.10,
)

val_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

train_data = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=True,
    seed=42,
)

val_data = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=False,
)

# ==========================================
# 4. CLASS WEIGHTS (training set only, same as Stage 1)
# ==========================================
train_labels = train_data.classes
class_weights_array = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(train_labels),
    y=train_labels,
)
class_weights = {i: w for i, w in enumerate(class_weights_array)}
print("Class weights:", class_weights)

# ==========================================
# 5. LOAD STAGE 1 MODEL
# ==========================================
print(f"\nLoading Stage 1 model from: {STAGE1_MODEL_PATH}")
model = tf.keras.models.load_model(STAGE1_MODEL_PATH)

# The EfficientNetB0 sub-model is a named layer inside the loaded model.
base_model = model.get_layer("efficientnetb0")
print(f"EfficientNetB0 has {len(base_model.layers)} internal layers.")

# ==========================================
# 6. UNFREEZE THE TOP LAYERS ONLY
# ==========================================
# We do NOT unfreeze the whole network:
#   - Early layers hold generic, broadly-useful features (edges, textures).
#     Retraining them from scratch-ish gradients on only 4,099 images
#     risks erasing that useful pretrained knowledge.
#   - ~4,099 training images is small for a 4M+ parameter network, so
#     unfreezing everything invites overfitting.
# We only unfreeze the LAST NUM_LAYERS_TO_UNFREEZE layers - roughly the
# final MBConv block(s) - so the network can adapt its most abstract,
# task-specific features to chest X-ray textures, while the low-level
# feature extractors stay untouched.
base_model.trainable = True
fine_tune_at = len(base_model.layers) - NUM_LAYERS_TO_UNFREEZE
for layer in base_model.layers[:fine_tune_at]:
    layer.trainable = False

unfrozen = sum(1 for l in base_model.layers if l.trainable)
print(f"Unfroze the last {unfrozen} of {len(base_model.layers)} EfficientNetB0 layers.")
print("First few now-trainable layer names:",
      [l.name for l in base_model.layers[fine_tune_at:fine_tune_at + 5]])

# ==========================================
# 7. RECOMPILE WITH A SMALL LEARNING RATE
# ==========================================
# Note: the model was originally built calling the base model with
# training=False (see train_model.py). That is baked into the saved
# graph, so BatchNorm layers keep using their frozen running statistics
# even now that base_model.trainable=True - this prevents the unstable
# gradients that fine-tuning BatchNorm with a small batch size can cause.
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=FT_LEARNING_RATE),
    loss="binary_crossentropy",
    metrics=[
        "accuracy",
        tf.keras.metrics.Precision(name="precision"),
        tf.keras.metrics.Recall(name="recall"),
        tf.keras.metrics.AUC(name="auc"),
    ],
)

model.summary()

# ==========================================
# 8. CALLBACKS
# ==========================================
callback_list = [
    EarlyStopping(
        monitor="val_loss",
        patience=4,
        restore_best_weights=True,
        verbose=1,
    ),
    ModelCheckpoint(
        FT_MODEL_SAVE_PATH,
        monitor="val_loss",
        save_best_only=True,
        verbose=1,
    ),
    ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.2,
        patience=2,
        min_lr=1e-7,
        verbose=1,
    ),
]

# ==========================================
# 9. FINE-TUNE
# ==========================================
history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=FT_EPOCHS,
    class_weight=class_weights,
    callbacks=callback_list,
)

# ==========================================
# 10. SAVE HISTORY + PLOTS
# ==========================================
with open(FT_HISTORY_SAVE_PATH, "w") as f:
    json.dump(history.history, f, indent=2)

plt.figure()
plt.plot(history.history["accuracy"], label="Training Accuracy")
plt.plot(history.history["val_accuracy"], label="Validation Accuracy")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.title("Stage 2: Fine-Tuning Accuracy")
plt.legend()
plt.savefig(os.path.join(PLOTS_DIR, "accuracy_finetune.png"))
plt.close()

plt.figure()
plt.plot(history.history["loss"], label="Training Loss")
plt.plot(history.history["val_loss"], label="Validation Loss")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.title("Stage 2: Fine-Tuning Loss")
plt.legend()
plt.savefig(os.path.join(PLOTS_DIR, "loss_finetune.png"))
plt.close()

best_val_loss = min(history.history["val_loss"])
best_epoch_idx = history.history["val_loss"].index(best_val_loss)
best_val_recall = history.history["val_recall"][best_epoch_idx]

print("\nStage 2 fine-tuning complete.")
print(f"Fine-tuned model saved to: {FT_MODEL_SAVE_PATH}")
print(f"History saved to: {FT_HISTORY_SAVE_PATH}")
print(f"Plots saved to: {PLOTS_DIR}")
print("\n--- Comparison ---")
print(f"Stage 1 best: val_loss={STAGE1_BEST_VAL_LOSS:.4f}, val_recall={STAGE1_BEST_VAL_RECALL:.4f}")
print(f"Stage 2 best: val_loss={best_val_loss:.4f}, val_recall={best_val_recall:.4f}")
