import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os

# ==========================================
# 1. SETTINGS
# ==========================================

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

BASE_DIR = r"C:\Users\NIDS\OneDrive\Desktop\xai\processed_dataset"

TRAIN_DIR = os.path.join(BASE_DIR, "train")
VAL_DIR = os.path.join(BASE_DIR, "validation")
TEST_DIR = os.path.join(BASE_DIR, "test")


# ==========================================
# 2. TRAINING DATA
# ==========================================

train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,

    # Data augmentation
    rotation_range=10,
    width_shift_range=0.10,
    height_shift_range=0.10,
    zoom_range=0.10
)


# ==========================================
# 3. VALIDATION DATA
# ==========================================

val_datagen = ImageDataGenerator(
    rescale=1.0 / 255
)


# ==========================================
# 4. TEST DATA
# ==========================================

test_datagen = ImageDataGenerator(
    rescale=1.0 / 255
)


# ==========================================
# 5. LOAD TRAINING DATA
# ==========================================

train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=True
)


# ==========================================
# 6. LOAD VALIDATION DATA
# ==========================================

val_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=False
)


# ==========================================
# 7. LOAD TEST DATA
# ==========================================

test_generator = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=False
)


# ==========================================
# 8. DISPLAY INFORMATION
# ==========================================

print("\n====================================")
print("DATASET INFORMATION")
print("====================================")

print("Image size:", IMG_SIZE)
print("Batch size:", BATCH_SIZE)

print("\nClass indices:")
print(train_generator.class_indices)

print("\nTraining images:", train_generator.samples)
print("Validation images:", val_generator.samples)
print("Test images:", test_generator.samples)

print("\nTraining batches:", len(train_generator))
print("Validation batches:", len(val_generator))
print("Test batches:", len(test_generator))


# ==========================================
# 9. CHECK ONE BATCH
# ==========================================

images, labels = next(train_generator)

print("\n====================================")
print("BATCH CHECK")
print("====================================")

print("Image batch shape:", images.shape)
print("Label batch shape:", labels.shape)

print("Minimum pixel value:", images.min())
print("Maximum pixel value:", images.max())

print("\nPreprocessing completed successfully!")