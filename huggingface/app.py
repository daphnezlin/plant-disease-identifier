import gradio as gr
import onnxruntime as ort
import numpy as np
from PIL import Image

session = ort.InferenceSession('plant_disease_model.onnx')

labels = [output.name for output in session.get_outputs()]

# Load class names from a separate file
import json
with open('classes.json') as f:
    class_names = json.load(f)

def format_label(raw_label):
    parts = raw_label.split("___")
    plant = parts[0].replace("_", " ")
    disease = parts[1].replace("_", " ") if len(parts) > 1 else "Healthy"
    return f"{plant} — {disease}"

def predict(image):
    image = image.resize((224, 224))
    img_array = np.array(image).astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_array = (img_array - mean) / std
    img_array = img_array.transpose(2, 0, 1)
    img_array = np.expand_dims(img_array, 0).astype(np.float32)
    
    outputs = session.run(None, {'input': img_array})
    probs = outputs[0][0]
    probs = np.exp(probs) / np.sum(np.exp(probs))
    
    top3_idx = np.argsort(probs)[-3:][::-1]
    return {format_label(class_names[i]): float(probs[i]) for i in top3_idx}

demo = gr.Interface(
    fn=predict,
    inputs=gr.Image(type="pil", label="Upload a plant photo"),
    outputs=gr.Label(num_top_classes=3, label="Diagnosis"),
    title="🌿 Plant Disease Detector",
    description="Upload a photo of a plant leaf and I'll identify any diseases."
)

demo.launch(server_name="0.0.0.0", server_port=7860)