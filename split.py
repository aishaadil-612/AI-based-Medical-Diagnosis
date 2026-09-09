import os
import shutil
import random

# Original dataset
SOURCE_DIR = r"C:\Users\NIDS\OneDrive\Desktop\xai\archive (5)\Pneumonia_Chest_Xray"

# New dataset
OUTPUT_DIR = r"C:\Users\NIDS\OneDrive\Desktop\xai\processed_dataset"

# Split ratios
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

random.seed(42)

classes = ["NORMAL", "PNEUMONIA"]

for class_name in classes:

    source_class = os.path.join(SOURCE_DIR, class_name)

    train_dir = os.path.join(OUTPUT_DIR, "train", class_name)
    val_dir = os.path.join(OUTPUT_DIR, "validation", class_name)
    test_dir = os.path.join(OUTPUT_DIR, "test", class_name)

    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(val_dir, exist_ok=True)
    os.makedirs(test_dir, exist_ok=True)

    images = [
        file for file in os.listdir(source_class)
        if file.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    random.shuffle(images)

    total = len(images)

    train_end = int(total * TRAIN_RATIO)
    val_end = train_end + int(total * VAL_RATIO)

    train_images = images[:train_end]
    val_images = images[train_end:val_end]
    test_images = images[val_end:]

    for image in train_images:
        shutil.copy2(
            os.path.join(source_class, image),
            os.path.join(train_dir, image)
        )

    for image in val_images:
        shutil.copy2(
            os.path.join(source_class, image),
            os.path.join(val_dir, image)
        )

    for image in test_images:
        shutil.copy2(
            os.path.join(source_class, image),
            os.path.join(test_dir, image)
        )

    print(f"\n{class_name}")
    print("Total:", total)
    print("Train:", len(train_images))
    print("Validation:", len(val_images))
    print("Test:", len(test_images))

print("\nDataset splitting completed!")