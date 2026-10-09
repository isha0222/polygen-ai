import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import "./App.css";

function Model({ modelUrl }) {
  const { scene } = useGLTF(modelUrl);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [quality, setQuality] = useState("draft");

  const [modelUrl, setModelUrl] = useState(
    "http://127.0.0.1:8000/api/v1/model?version=1"
  );

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const generateModel = async () => {
    if (!prompt.trim()) {
      setStatus("Please enter a prompt.");
      return;
    }

    try {
      setLoading(true);
      setStatus("⏳ Generating 3D model...");

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
            style: style,
            quality: quality,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const data = await response.json();

      console.log("Generation response:", data);

      if (data.status === "done") {

        const newModelUrl =
          `http://127.0.0.1:8000/api/v1/model?version=${Date.now()}`;

        setModelUrl(newModelUrl);

        setStatus("✅ 3D model generated successfully!");

        setHistory((previousHistory) => [
          {
            id: Date.now(),
            prompt: prompt,
            style: style,
            quality: quality,
            createdAt: new Date().toLocaleString(),
          },
          ...previousHistory,
        ]);

      } else if (data.status === "timeout") {

        setStatus(
          "⚠️ Generation is taking longer than expected."
        );

      } else {

        setStatus(
          "⚠️ Generation returned an unexpected response."
        );
      }

    } catch (error) {

      console.error("Generation error:", error);

      setStatus(
        "❌ Something went wrong while generating the model."
      );

    } finally {

      setLoading(false);

    }
  };

  const downloadModel = () => {
    window.open(
      "http://127.0.0.1:8000/api/v1/model",
      "_blank"
    );
  };

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">
        <div>
          <h1>PolyGen</h1>
          <p>Text-to-3D Generation Pipeline</p>
        </div>
      </header>


      {/* MAIN */}

      <main className="main">

        {/* LEFT PANEL */}

        <section className="prompt-section">

          <h2>Create a 3D Model</h2>

          <p className="subtitle">
            Describe anything you want to generate in 3D.
          </p>


          {/* PROMPT */}

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: A futuristic robot"
          />


          {/* OPTIONS */}

          <div className="options">

            <label>
              Style

              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="realistic">
                  Realistic
                </option>

                <option value="low-poly">
                  Low Poly
                </option>

                <option value="cartoon">
                  Cartoon
                </option>

                <option value="sci-fi">
                  Sci-Fi
                </option>

                <option value="minimalist">
                  Minimalist
                </option>
              </select>
            </label>


            <label>
              Quality

              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="draft">
                  Draft
                </option>

                <option value="standard">
                  Standard
                </option>

                <option value="high">
                  High
                </option>
              </select>
            </label>

          </div>


          {/* GENERATE BUTTON */}

          <button
            onClick={generateModel}
            disabled={loading}
          >
            {loading
              ? "⏳ Generating..."
              : "✨ Generate 3D"}
          </button>


          {/* DOWNLOAD BUTTON */}

          <button
            className="download-button"
            onClick={downloadModel}
          >
            ⬇ Download GLB
          </button>


          {/* STATUS */}

          {status && (
            <p className="status">
              {status}
            </p>
          )}

        </section>


        {/* 3D VIEWER */}

        <section className="viewer-card">

          <Canvas
            camera={{
              position: [4, 3, 5],
              fov: 45
            }}
          >

            <ambientLight intensity={1} />

            <directionalLight
              position={[5, 5, 5]}
              intensity={2}
            />

            <Model modelUrl={modelUrl} />

            <OrbitControls />

          </Canvas>


          <div className="viewer-label">
            🧊 Generated 3D Model
          </div>

        </section>

      </main>


      {/* HISTORY */}

      <section className="history-section">

        <h2>Generation History</h2>


        {history.length === 0 ? (

          <p className="empty-history">
            No models generated yet.
          </p>

        ) : (

          <div className="history-list">

            {history.map((item) => (

              <div
                className="history-card"
                key={item.id}
              >

                <h3>
                  {item.prompt}
                </h3>

                <div className="history-info">

<span>
  Style: {item.style}
</span>

<span>
  Quality: {item.quality}
</span>

<span>
  {item.createdAt}
</span>

</div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}

export default App;
