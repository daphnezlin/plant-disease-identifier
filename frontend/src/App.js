import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setResults(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

const handleSubmit = async () => {
  if (!imageFile) return;
  setLoading(true);
  setResults(null);
  setError(null);

  try {
    const { Client } = await import("https://esm.sh/@gradio/client");
    const client = await Client.connect("daphnezlin/plant-disease-identifier");
    const result = await client.predict("/predict", { image: imageFile });
    setResults(result.data[0].confidences);
  } catch (e) {
    setError("Something went wrong. Please try again.");
  }
  setLoading(false);
};

  const formatLabel = (raw) => {
    const parts = raw.split("___");
    const plant = parts[0].replace(/_/g, " ");
    const disease = parts[1] ? parts[1].replace(/_/g, " ") : "Healthy";
    return { plant, disease };
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-icon">🌿</div>
        <h1>Plant Disease Identifier</h1>
        <p>Upload a photo of a plant leaf for an instant AI-powered diagnosis</p>
      </header>

      <main className="main">
        <section className="card">
          <h2 className="section-title">How to use</h2>
          <ol className="steps">
            <li><strong>Take a clear photo</strong> of a single leaf — fill the frame, avoid busy backgrounds and shadows.</li>
            <li><strong>Upload your photo</strong> by clicking the area below or dragging and dropping.</li>
            <li><strong>Click Identify</strong> to get the top 3 possible conditions with confidence scores.</li>
          </ol>
        </section>

        <section className="card">
          <h2 className="section-title">Upload leaf photo</h2>
          <div
            className={`dropzone ${dragging ? "dragging" : ""} ${image ? "has-image" : ""}`}
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {image ? (
              <img src={image} alt="uploaded leaf" className="preview" />
            ) : (
              <div className="drop-prompt">
                <span className="drop-icon">📷</span>
                <span className="drop-text">Drag and drop your photo here</span>
                <span className="drop-sub">or click to browse</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {image && (
            <button className="change-btn" onClick={() => fileRef.current.click()}>
              Change photo
            </button>
          )}

          <button
            className={`identify-btn ${loading ? "loading" : ""}`}
            onClick={handleSubmit}
            disabled={!imageFile || loading}
          >
            {loading ? (
              <span className="spinner-row"><span className="spinner" /> Analysing...</span>
            ) : "Identify disease"}
          </button>

          {error && <p className="error">{error}</p>}
        </section>

        {results && (
          <section className="card results-card">
            <h2 className="section-title">Results</h2>
            {results.map((r, i) => {
              const { plant, disease } = formatLabel(r.label);
              const pct = (r.confidence * 100).toFixed(1);
              return (
                <div key={i} className={`result-item ${i === 0 ? "top" : ""}`}>
                  <div className="result-header">
                    <div>
                      <span className="result-plant">{plant}</span>
                      <span className="result-disease">{disease}</span>
                    </div>
                    <div className="result-right">
                      {i === 0 && <span className="top-badge">Top match</span>}
                      <span className="result-pct">{pct}%</span>
                    </div>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="tip">
              For best results, ensure the leaf is well-lit and fills most of the frame.
              This model is trained on lab conditions and may be less accurate on real-world photos.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;