import gradio as gr
from fastai.vision.all import *

learn = load_learner('plant_disease_model.pkl')

def format_label(raw_label):
    parts = raw_label.split("___")
    plant = parts[0].replace("_", " ")
    disease = parts[1].replace("_", " ") if len(parts) > 1 else "Healthy"
    return f"{plant} — {disease}"

def predict(image):
    img = PILImage.create(image)
    pred, pred_idx, probs = learn.predict(img)
    top3 = sorted(zip(learn.dls.vocab, map(float, probs)),
                  key=lambda x: x[1], reverse=True)[:3]
    return {format_label(label): prob for label, prob in top3}

demo = gr.Interface(
    fn=predict,
    inputs=gr.Image(type="filepath", label="Upload a plant photo"),
    outputs=gr.Label(num_top_classes=3, label="Diagnosis"),
    title="🌿 Plant Disease Detector",
    description="Upload a photo of a plant leaf and I'll identify any diseases."
)

demo.launch()