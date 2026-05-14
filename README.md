# Plant Disease Identifier

A full-stack machine learning web app that identifies plant diseases from leaf photos. Upload a photo of a plant leaf and get an instant AI-powered diagnosis with treatment recommendations.

**[Live App](https://plant-disease-identifier-flame.vercel.app/)** · **[Hugging Face Space](https://huggingface.co/spaces/daphnezlin/plant-disease-identifier)**

---

## Demo

Upload a photo of a plant leaf → get top 3 disease matches with confidence scores → view description, urgency, and treatment steps.

---

## Features

- Classifies plant diseases across 38 classes and 14 plant species
- Returns top 3 predictions with confidence percentages
- Treatment recommendations for each disease including description, urgency, and action steps
- Fast CPU inference — no GPU required

---

## Architecture

```
User uploads photo
       ↓
React frontend (Vercel)
       ↓
Gradio REST API (Hugging Face Spaces)
       ↓
ONNX Runtime inference
       ↓
Results + treatment recommendations displayed
```

**Frontend** — React, JavaScript, CSS, deployed on Vercel

**Backend / ML Serving** — Gradio, ONNX Runtime, deployed on Hugging Face Spaces

**Model** — ResNet34 CNN trained with fastai and PyTorch on the PlantVillage dataset, exported to ONNX for fast CPU inference

---

## Model

- **Architecture**: ResNet34 (pretrained on ImageNet, fine-tuned via transfer learning)
- **Dataset**: PlantVillage — 54,000 color images across 38 disease classes
- **Training**: 10 epochs with data augmentation (rotation, zoom, flipping)
- **Validation accuracy**: 99.7%
- **Optimization**: Exported to ONNX format, enabling sub-second CPU inference without GPU hardware

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, JavaScript, CSS |
| ML Training | Python, PyTorch, fast.ai |
| ML Serving | ONNX Runtime, Gradio |
| Frontend Hosting | Vercel |
| Backend Hosting | Hugging Face Spaces |
| Version Control | Git, GitHub |

---

## Local Development

**Frontend**
```bash
cd frontend
npm install
npm start
```

Opens at `http://localhost:3000`. The app calls the Hugging Face API directly so no local backend setup is needed.

---

## Project Structure

```
plant-disease-identifier/
├── frontend/          # React app
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   └── treatments.json
│   └── package.json
└── huggingface/       # ML backend (deployed to Hugging Face Spaces)
    ├── app.py
    ├── classes.json
    └── requirements.txt
```

---

## Disease Classes

The model identifies diseases across 14 plant species including tomato, potato, corn, grape, apple, peach, strawberry, and more — covering 38 total classes.

---

## Limitations

- Trained on lab-condition images (single leaf, plain background) — real-world accuracy may vary
- For best results: photograph a single leaf against a neutral background in good lighting
