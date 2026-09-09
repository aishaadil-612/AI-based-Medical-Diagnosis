import os
from PIL import Image

dataset_path = r"archive (5)\Pneumonia_Chest_Xray"

for class_name in ["NORMAL", "PNEUMONIA"]:

    folder = os.path.join(dataset_path, class_name)

    print("\n" + class_name)

    count = 0

    for file in os.listdir(folder):

        if file.lower().endswith((".jpg", ".jpeg", ".png")):

            image_path = os.path.join(folder, file)

            image = Image.open(image_path)

            print(file, "->", image.size)

            count += 1

            if count == 10:
                break