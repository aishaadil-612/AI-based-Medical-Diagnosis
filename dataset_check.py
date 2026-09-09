import os

dataset_path = r"archive (5)\Pneumonia_Chest_Xray"

normal_path = os.path.join(dataset_path, "NORMAL")
pneumonia_path = os.path.join(dataset_path, "PNEUMONIA")

normal_images = os.listdir(normal_path)
pneumonia_images = os.listdir(pneumonia_path)

print("Normal images:", len(normal_images))
print("Pneumonia images:", len(pneumonia_images))
print("Total images:", len(normal_images) + len(pneumonia_images))