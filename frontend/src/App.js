import { useState, useRef } from "react";
import { Client } from "@gradio/client";
import "./App.css";
import exampleLeaf from './appleblackrot.jpeg';
import treatments from './treatments.json';

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
    const disease = parts[1] ? parts[1].replace(/_/g, " ").toLowerCase() : "";
    return { plant, disease };
  };

  const [activeTab, setActiveTab] = useState("instructions");

  return (
    <div className="app">
      <div className="hero">
        <div className="hero-icon"></div>
        <h1>Plant Disease Identifier</h1>
        <p>Upload a photo of a plant leaf for an instant diagnosis</p>
      </div>

      <main className="main">
        <div className="tabs">
          <button className={`tab ${activeTab === "instructions" ? "active" : ""}`} onClick={() => setActiveTab("instructions")}>Instructions</button>
          <button className={`tab ${activeTab === "upload" ? "active" : ""}`} onClick={() => setActiveTab("upload")}>Upload</button>
          <button className={`tab ${activeTab === "results" ? "active" : ""}`} onClick={() => setActiveTab("results")}>Results</button>
        </div>

        {activeTab === "instructions" && (
          <section className="card">
            <ol className="steps">
              <li><strong>Take a clear photo</strong> of a leaf on a grey or other neutrally coloured background, filling the frame.</li>
              <li><strong>Upload your photo</strong> in the upload tab by clicking the area or dragging and dropping.</li>
              <li><strong>Click Identify</strong> to get the top 3 possible conditions with confidence scores, plus personalized treatment information.</li>
            </ol>
            <div className="example-photo">
              <p className="example-label">Example of a good photo:</p>
              <img src={exampleLeaf} alt="Example of a clear leaf" className="example-img" />
            </div>
          </section>
        )}

        {activeTab === "upload" && (
          <section className="card">
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
                  <span className="drop-icon"></span>
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
              onClick={async () => { await handleSubmit(); if (!error) setActiveTab("results"); }}
              disabled={!imageFile || loading}
            >
              {loading ? (
                <span className="spinner-row"><span className="spinner" /> Analysing...</span>
              ) : "Identify disease"}
            </button>

            {error && <p className="error">{error}</p>}
          </section>
        )}

        {activeTab === "results" && (
          <section className="card results-card">
            {results ? (
              <>
                <p className="heading">Top three matches:</p>
                {results.map((r, i) => {
                  const { plant, disease } = formatLabel(r.label);
                  const pct = (r.confidence * 100).toFixed(1);
                  console.log(r.label);
                  return (
                    <div key={i} className={`result-item ${i === 0 ? "top" : ""}`}>
                      <div className="result-header">
                        <div>
                          <span className="result-plant">{plant}{disease ? `: ${disease}` : ""}</span>
                        </div>
                        <div className="result-right">
                          <span className="result-pct">{pct}% probability</span>
                        </div>
                      </div>
                      <div className="bar-bg">
                        <div className="bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {results && results.length > 0 && (() => {
                  const topLabel = results[0].label;
                  console.log("Looking up:", topLabel);
                  const treatment = treatments[topLabel];
                  console.log("Found treatment:", treatment);
                  return treatment ? (
                    <div className="treatment">
                      <p className="heading">Description:</p>
                      <p className="treatment-description">{treatment.description}</p>
                      <p className="heading">Urgency:</p>
                      <p className={`urgency-badge urgency-${treatment.severity}`}>
                        {treatment.severity === 'none' ? ' None' : ` ${treatment.urgency}`}
                      </p>
                      <p className="heading">What to do:</p>
                      <ul className="treatment-steps">
                        {treatment.treatment.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null;
                })()}
              </>
            ) : (
              <p className="no-results">No results yet- upload a leaf photo and click Identify.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;