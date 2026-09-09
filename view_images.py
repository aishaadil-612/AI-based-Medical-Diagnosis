import os
import matplotlib.pyplot as plt
from PIL import Image

dataset_path = r"archive (5)\Pneumonia_Chest_Xray"

classes = ["NORMAL", "PNEUMONIA"]

plt.figure(figsize=(12, 7))

for row, class_name in enumerate(classes):

    folder = os.path.join(dataset_path, class_name)

    images = [
        f for f in os.listdir(folder)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    for col in range(5):

        image_path = os.path.join(folder, images[col])

        image = Image.open(image_path)

        plt.subplot(2, 5, row * 5 + col + 1)

        plt.imshow(image, cmap="gray")
        plt.title(class_name)
        plt.axis("off")

plt.tight_layout()
plt.show()