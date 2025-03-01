import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator, img_to_array, load_img

# Define paths
DATASET_PATH = "data/data/data"  # Update this if needed
IMG_SIZE = (224, 224)  # Resize to 224x224 for CNN compatibility
BATCH_SIZE = 32  # Adjust based on available GPU/CPU power

# Define ImageDataGenerator for data augmentation
datagen = ImageDataGenerator(
    rescale=1.0 / 255.0,  # Normalize pixel values to [0,1]
    rotation_range=20,  # Random rotation
    width_shift_range=0.2,  # Random horizontal shift
    height_shift_range=0.2,  # Random vertical shift
    shear_range=0.2,  # Shearing transformation
    zoom_range=0.2,  # Zoom augmentation
    horizontal_flip=True,  # Flip horizontally
    fill_mode="nearest",
)

# Preprocess dataset function
def preprocess_and_save_images(data_type="train"):
    data_dir = os.path.join(DATASET_PATH, data_type)
    output_dir = f"preprocessed/{data_type}"
    os.makedirs(output_dir, exist_ok=True)  # Create folder if it doesn't exist

    for class_name in os.listdir(data_dir):  # Loop through each class
        class_path = os.path.join(data_dir, class_name)
        save_class_path = os.path.join(output_dir, class_name)
        os.makedirs(save_class_path, exist_ok=True)

        for img_name in os.listdir(class_path):
            img_path = os.path.join(class_path, img_name)
            try:
                # Load and preprocess image
                img = load_img(img_path, target_size=IMG_SIZE)
                img_array = img_to_array(img) / 255.0  # Normalize
                img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension

                # Apply augmentation (save multiple augmented versions)
                for i, augmented_img in enumerate(datagen.flow(img_array, batch_size=1)):
                    augmented_img = augmented_img[0]  # Remove batch dimension
                    save_path = os.path.join(save_class_path, f"{i}_{img_name}")
                    tf.keras.preprocessing.image.save_img(save_path, augmented_img)
                    if i >= 2:  # Save only 3 versions per image
                        break

            except Exception as e:
                print(f"Error processing {img_path}: {e}")

# Run preprocessing for train, val, and test sets
for dataset_type in ["train", "val", "test"]:
    preprocess_and_save_images(dataset_type)

print("✅ Data preprocessing complete! Images are saved in 'preprocessed/'")
