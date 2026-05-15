import { useState, useRef, useEffect } from "react";
import { Client } from "@gradio/client";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import apple from './appleblackrot.jpeg';
import cornHealthy from './cornhealthy.jpeg';
import cornSpot from './corncercosporaleafspot.jpg';
import strawberry from './strawberryleafscorch.jpeg';
import treatments from './treatments.json';
import { supabase } from './supabase';

const contagiousDiseases = [
  "Apple___Apple_scab",
  "Apple___Black_rot",
  "Apple___Cedar_apple_rust",
  "Cherry_(including_sour)___Powdery_mildew",
  "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
  "Corn_(maize)___Common_rust_",
  "Corn_(maize)___Northern_Leaf_Blight",
  "Grape___Black_rot",
  "Grape___Esca_(Black_Measles)",
  "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
  "Orange___Haunglongbing_(Citrus_greening)",
  "Peach___Bacterial_spot",
  "Pepper,_bell___Bacterial_spot",
  "Potato___Early_blight",
  "Potato___Late_blight",
  "Squash___Powdery_mildew",
  "Strawberry___Leaf_scorch",
  "Tomato___Bacterial_spot",
  "Tomato___Early_blight",
  "Tomato___Late_blight",
  "Tomato___Leaf_Mold",
  "Tomato___Septoria_leaf_spot",
  "Tomato___Spider_mites Two-spotted_spider_mite",
  "Tomato___Target_Spot",
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
  "Tomato___Tomato_mosaic_virus",
];

const diseaseColorList = [
  "#ef4444","#f97316","#eab308","#84cc16","#14b8a6",
  "#06b6d4","#3b82f6","#8b5cf6","#ec4899","#f43f5e",
  "#a855f7","#0ea5e9","#10b981","#f59e0b","#6366f1",
  "#d946ef","#fb923c","#facc15","#4ade80","#2dd4bf",
  "#60a5fa","#c084fc","#f472b6","#fb7185","#a3e635",
  "#34d399",
];

const diseaseColorMap = {};
contagiousDiseases.forEach((d, i) => {
  diseaseColorMap[d] = diseaseColorList[i];
});

const getColor = (rawLabel) => diseaseColorMap[rawLabel] || "#639922";

function App() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [shareLocation, setShareLocation] = useState(false);
  const [mapReports, setMapReports] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState("all");
  const [activeTab, setActiveTab] = useState("instructions");
  const fileRef = useRef();

  useEffect(() => {
    if (activeTab === "map") fetchReports();
  }, [activeTab]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("disease_reports")
      .select("*")
      .not("disease", "ilike", "%healthy%")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error) setMapReports(data);
  };

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
      const predictions = result.data[0].confidences;
      setResults(predictions);
      if (shareLocation && predictions.length > 0) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await supabase.from("disease_reports").insert({
            disease: predictions[0].label,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            confidence: predictions[0].confidence,
          });
        });
      }
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

  const formatLabelShort = (raw) => {
    const { plant, disease } = formatLabel(raw);
    return disease ? `${plant}: ${disease}` : plant;
  };

  const filteredReports = mapReports.filter(
    (r) => selectedDisease === "all" || r.disease === selectedDisease
  );

  const topTreatment = results && results.length > 0 ? treatments[results[0].label] : null;

  return (
    <div className="app">
      <nav className="navbar">
        <span className="navbar-title">Plant Disease Identifier</span>
        <div className="navbar-tabs">
          <button className={`nav-tab ${activeTab === "instructions" ? "active" : ""}`} onClick={() => setActiveTab("instructions")}>Instructions</button>
          <button className={`nav-tab ${activeTab === "upload" ? "active" : ""}`} onClick={() => setActiveTab("upload")}>Upload</button>
          <button className={`nav-tab ${activeTab === "results" ? "active" : ""}`} onClick={() => setActiveTab("results")}>Results</button>
          <button className={`nav-tab ${activeTab === "map" ? "active" : ""}`} onClick={() => setActiveTab("map")}>Disease Map</button>
        </div>
      </nav>

      <main className="main">

        {activeTab === "instructions" && (
          <div className="content-grid instructions-grid">
            <div>
              <p className="heading">How to use</p>
              <ol className="steps">
                <li><strong>Take a clear picture</strong> of the leaf so it takes up most of or all of the frame. If it doesn't fill the frame, make sure the leaf is on a grey or other neutrally coloured background.</li>
                <li><strong>Upload your photo</strong> in the Upload tab by clicking the area or dragging and dropping.</li>
                <li><strong>Click Identify</strong> to get the top 3 possible conditions with confidence scores and treatment information.</li>
                <li><strong>Optionally share your location</strong> to contribute to the disease outbreak map.</li>
              </ol>
            </div>
            <div>
              <p className="heading">Examples of good photos</p>
              <div className="example-grid">
                <div className="example-item">
                  <img src={apple} alt="Apple black rot" className="example-img" />
                </div>
                <div className="example-item">
                  <img src={cornHealthy} alt="Healthy corn" className="example-img" />
                </div>
                <div className="example-item">
                  <img src={cornSpot} alt="Corn cercospora leaf spot" className="example-img" />
                </div>
                <div className="example-item">
                  <img src={strawberry} alt="Strawberry leaf scorch" className="example-img" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="content-grid upload-grid">
            <div>
              <p className="heading">Upload leaf photo</p>
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
            </div>
            <div className="upload-actions">
              <label className="location-label">
                <input
                  type="checkbox"
                  checked={shareLocation}
                  onChange={(e) => setShareLocation(e.target.checked)}
                  className="location-checkbox"
                />
                Share my location to help track disease outbreaks
              </label>
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
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <div className="content-grid results-grid">
            <div className="results-image-col">
              <p className="heading">Uploaded photo</p>
              {image ? (
                <img src={image} alt="uploaded leaf" className="results-image" />
              ) : (
                <p className="no-results">No photo uploaded yet.</p>
              )}
            </div>

            <div className="results-matches-col">
              <p className="heading">Top three matches</p>
              {results ? results.map((r, i) => {
                const { plant, disease } = formatLabel(r.label);
                const pct = (r.confidence * 100).toFixed(1);
                return (
                  <div key={i} className="result-item">
                    <div className="result-header">
                      <span className="result-plant">{plant}{disease ? `: ${disease}` : ""}</span>
                      <span className="result-pct">{pct}%</span>
                    </div>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="no-results">No results yet — upload a photo and click Identify.</p>}
            </div>

            <div className="results-treatment-col">
              {topTreatment ? (
                <>
                  <p className="heading">Description</p>
                  <p className="treatment-description">{topTreatment.description}</p>
                  <p className="heading">Urgency</p>
                  <p className={`urgency-badge urgency-${topTreatment.severity}`}>
                    {topTreatment.severity === 'none' ? 'None' : topTreatment.urgency}
                  </p>
                  <p className="heading">What to do</p>
                  <ul className="treatment-steps">
                    {topTreatment.treatment.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="no-results">Treatment information will appear here after identification.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "map" && (
          <div className="map-section">
            <div className="map-header">
              <div>
                <p className="heading">Community disease reports</p>
                <p className="map-subtitle">Showing the 500 most recent contagious disease reports shared by users.</p>
              </div>
              <select
                className="disease-dropdown"
                value={selectedDisease}
                onChange={(e) => setSelectedDisease(e.target.value)}
              >
                <option value="all">All contagious diseases</option>
                {contagiousDiseases.map((d) => {
                  const { plant, disease } = formatLabel(d);
                  return (
                    <option key={d} value={d}>
                      {plant}{disease ? `: ${disease}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="map-wrapper">
              <MapContainer center={[20, 0]} zoom={2} className="map">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {filteredReports.map((report) => {
                  const { plant, disease } = formatLabel(report.disease);
                  const color = getColor(report.disease);
                  return (
                    <CircleMarker
                      key={report.id}
                      center={[report.latitude, report.longitude]}
                      radius={6}
                      fillColor={color}
                      color={color}
                      weight={1}
                      fillOpacity={0.8}
                    >
                      <Popup>
                        <strong>{plant}{disease ? `: ${disease}` : ""}</strong><br />
                        {(report.confidence * 100).toFixed(1)}% confidence<br />
                        <span style={{ fontSize: "0.75rem", color: "#666" }}>
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>

            {selectedDisease !== "all" && (
              <div className="legend-single">
                <span className="legend-dot" style={{ background: getColor(selectedDisease) }} />
                <span className="legend-label">{formatLabelShort(selectedDisease)}</span>
              </div>
            )}

            {filteredReports.length === 0 && (
              <p className="map-empty">
                {selectedDisease === "all"
                  ? "No reports yet. Be the first to share your location!"
                  : "No reports yet for this disease."}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;