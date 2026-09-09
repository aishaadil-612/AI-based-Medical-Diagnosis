
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os

# ==========================================
# 1. DATASET PATH
# ==========================================

DATASET_PATH = r"C:\Users\NIDS\OneDrive\Desktop\xai\archive (5)\Pneumonia_Chest_Xray"

# ==========================================
# 2. IMAGE SETTINGS
# ==========================================

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

# ==========================================
# 3. TRAINING DATA
# ==========================================

train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.30,

    # Data augmentation
    rotation_range=10,
    width_shift_range=0.10,
    height_shift_range=0.10,
    zoom_range=0.10,
    horizontal_flip=True
)

train_data = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    subset="training",
    shuffle=True,
    seed=42
)

# ==========================================
# 4. VALIDATION DATA
# ==========================================

validation_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.30
)

validation_data = validation_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    subset="validation",
    shuffle=False,
    seed=42
)

# ==========================================
# 5. DISPLAY INFORMATION
# ==========================================

print("\n==============================")
print("DATASET INFORMATION")
print("==============================")

print("Image size:", IMG_SIZE)
print("Batch size:", BATCH_SIZE)

print("\nClass indices:")
print(train_data.class_indices)

print("\nTraining images:", train_data.samples)
print("Validation images:", validation_data.samples)

print("\nNumber of training batches:", len(train_data))
print("Number of validation batches:", len(validation_data))
