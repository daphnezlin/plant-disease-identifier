import { useState, useRef } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!imageFile) return;
    setLoading(true);
    setResult(null);
    const form = new FormData();
    form.append("file", imageFile);
    form.append("symptoms", symptoms);
    form.append("location", location);
    try {
      const res = await fetch("http://127.0.0.1:8000/identify", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert("Could not reach the server. Is it running?");
    }
    setLoading(false);
  };

  const urgencyConfig = {
    green:  { label: "LOW RISK",    color: "#4ade80", bg: "rgba(74,222,128,0.1)"  },
    yellow: { label: "MONITOR",     color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
    red:    { label: "SEE A DOCTOR",color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  };

  return (
    <div className="app">
      <div className="grain" />

      <header className="header">
        <div className="logo">🔬 BiteCheck</div>
        <p className="tagline">AI-powered bug bite identification</p>
      </header>

      <main className="main">
        <div className="card upload-card">
          <div
            className={`dropzone ${dragging ? "dragging" : ""} ${image ? "has-image" : ""}`}
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {image ? (
              <img src={image} alt="uploaded" className="preview" />
            ) : (
              <div className="drop-prompt">
                <span className="drop-icon">📷</span>
                <span className="drop-text">Drop a photo or tap to upload</span>
                <span className="drop-sub">JPG, PNG, HEIC supported</span>
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

          <div className="fields">
            <div className="field">
              <label>Symptoms</label>
              <input
                type="text"
                placeholder="e.g. itchy, swollen, appeared 3 hours ago"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Your location</label>
              <input
                type="text"
                placeholder="e.g. Ontario, Canada"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <button
            className={`identify-btn ${loading ? "loading" : ""}`}
            onClick={handleSubmit}
            disabled={!imageFile || loading}
          >
            {loading ? (
              <span className="spinner-row"><span className="spinner" /> Analyzing...</span>
            ) : "Identify Bite"}
          </button>
        </div>

        {result && (
          <div className="card results-card">
            <div className="result-header">
              <div className="bite-type">
                <span className="bite-label">Most likely</span>
                <span className="bite-name">{result.most_likely}</span>
              </div>
              <div
                className="urgency-badge"
                style={{
                  color: urgencyConfig[result.urgency]?.color,
                  background: urgencyConfig[result.urgency]?.bg,
                  borderColor: urgencyConfig[result.urgency]?.color,
                }}
              >
                {urgencyConfig[result.urgency]?.label}
              </div>
            </div>

            <div className="confidence-row">
              <span>Confidence</span>
              <span className="confidence-pill">{result.confidence}</span>
            </div>

            <div className="divider" />

            <div className="result-section">
              <h3>📋 Urgency</h3>
              <p>{result.urgency_reason}</p>
            </div>

            <div className="result-section">
              <h3>💊 Treatment</h3>
              <p>{result.treatment}</p>
            </div>

            <div className="result-section red-flags">
              <h3>🚨 Red Flags — See a doctor if:</h3>
              <p>{result.red_flags}</p>
            </div>

            <p className="disclaimer">{result.disclaimer}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;