"""
train_model.py
Phase 3 — Stage 1: EfficientNetB0 feature extraction (base frozen)

Loads the already-split dataset from processed_dataset/{train,validation},
computes class weights from the training set only, builds an
EfficientNetB0 transfer-learning model, and trains the classification
head. The test/ folder is intentionally NOT touched here - it is
reserved for evaluate_model.py in Phase 4.
"""

import os
import json
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight

# ==========================================
# 1. PATHS
# ==========================================
PROJECT_ROOT = r"C:\Users\NIDS\OneDrive\Desktop\xai"
DATASET_ROOT = os.path.join(PROJECT_ROOT, "processed_dataset")
TRAIN_DIR = os.path.join(DATASET_ROOT, "train")
VAL_DIR = os.path.join(DATASET_ROOT, "validation")
# processed_dataset/test is NOT loaded in this script on purpose.

MODEL_SAVE_PATH = os.path.join(PROJECT_ROOT, "pneumonia_efficientnetb0.keras")
HISTORY_SAVE_PATH = os.path.join(PROJECT_ROOT, "training_history_stage1.json")
PLOTS_DIR = os.path.join(PROJECT_ROOT, "plots")
os.makedirs(PLOTS_DIR, exist_ok=True)

# ==========================================
# 2. CONFIG
# ==========================================
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS_STAGE1 = 20
LEARNING_RATE_STAGE1 = 1e-3

# ==========================================
# 3. DATA GENERATORS
# ==========================================
# EfficientNetB0 (tf.keras.applications) has a built-in rescaling step
# and expects raw pixel values in [0, 255]. preprocess_input() for
# EfficientNet applies that same expected scaling. We deliberately do
# NOT divide by 255 ourselves here - doing so would rescale the pixels
# twice (once manually, once inside the model), which quietly shrinks
# every input toward zero and hurts training.
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=10,
    width_shift_range=0.10,
    height_shift_range=0.10,
    zoom_range=0.10,
    # No horizontal_flip: chest X-rays are not left-right symmetric
    # (heart position, aortic arch, gastric bubble), so flipping can
    # train the model on anatomically implausible images.
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

print("Class indices:", train_data.class_indices)

# ==========================================
# 4. CLASS WEIGHTS (training set ONLY)
# ==========================================
train_labels = train_data.classes
class_counts = np.bincount(train_labels)

print("\nClass distribution (training set only):")
for class_name, idx in train_data.class_indices.items():
    print(f"{class_name}: {class_counts[idx]}")

class_weights_array = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(train_labels),
    y=train_labels,
)
class_weights = {i: w for i, w in enumerate(class_weights_array)}

print("\nClass weights:")
for idx, weight in class_weights.items():
    print(f"{idx}: {weight:.4f}")

# ==========================================
# 5. MODEL — Stage 1: Feature Extraction
# ==========================================
base_model = EfficientNetB0(
    include_top=False,
    weights="imagenet",
    input_shape=(224, 224, 3),
    pooling=None,
)
base_model.trainable = False  # freeze pretrained weights for Stage 1

inputs = layers.Input(shape=(224, 224, 3))
x = base_model(inputs, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.3)(x)
outputs = layers.Dense(1, activation="sigmoid")(x)

model = models.Model(inputs, outputs)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE_STAGE1),
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
# 6. CALLBACKS
# ==========================================
callback_list = [
    EarlyStopping(
        monitor="val_loss",
        patience=5,
        restore_best_weights=True,
        verbose=1,
    ),
    ModelCheckpoint(
        MODEL_SAVE_PATH,
        monitor="val_loss",
        save_best_only=True,
        verbose=1,
    ),
    ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.2,
        patience=3,
        min_lr=1e-6,
        verbose=1,
    ),
]

# ==========================================
# 7. TRAIN — STAGE 1
# ==========================================
history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS_STAGE1,
    class_weight=class_weights,
    callbacks=callback_list,
)

# ==========================================
# 8. SAVE HISTORY
# ==========================================
with open(HISTORY_SAVE_PATH, "w") as f:
    json.dump(history.history, f, indent=2)

# ==========================================
# 9. TRAINING PLOTS
# ==========================================
plt.figure()
plt.plot(history.history["accuracy"], label="Training Accuracy")
plt.plot(history.history["val_accuracy"], label="Validation Accuracy")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.title("Stage 1: Training vs Validation Accuracy")
plt.legend()
plt.savefig(os.path.join(PLOTS_DIR, "accuracy.png"))
plt.close()

plt.figure()
plt.plot(history.history["loss"], label="Training Loss")
plt.plot(history.history["val_loss"], label="Validation Loss")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.title("Stage 1: Training vs Validation Loss")
plt.legend()
plt.savefig(os.path.join(PLOTS_DIR, "loss.png"))
plt.close()

print("\nStage 1 training complete.")
print(f"Best model saved to: {MODEL_SAVE_PATH}")
print(f"History saved to: {HISTORY_SAVE_PATH}")
print(f"Plots saved to: {PLOTS_DIR}")
