import logo from './assets/corpusmindlogo.png'
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Aurora from './components/Aurora.jsx'
import ClickSpark from './components/ClickSpark.jsx'
import SplitText from "./components/SplitText.jsx";
import GooeyNav from './components/GooeyNav.jsx'
import MagicBento from './components/MagicBento.jsx'
import SpotlightCard from './components/SpotlightCard.jsx';

const API = "http://localhost:8000"; // ← ADDED

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

const items = [
  { label: "Home", href: "#home" },
  { label: "Demo", href: "#demo" },
  { label: "About", href: "#about" },
];

function App() {
  const [page, setPage] = useState("home")

  // ← ADDED: state for backend responses
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [answerSources, setAnswerSources] = useState([])
  const [conflicts, setConflicts] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState("")

  // ← ADDED: upload handler
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg("Uploading & indexing...");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/ingest/file`, { method: "POST", body: form });
      const data = await res.json();
      setUploadMsg(res.ok ? `✅ "${data.filename}" indexed (${data.chunks_indexed} chunks)` : `❌ ${data.detail}`);
    } catch {
      setUploadMsg("❌ Could not reach backend. Is it running?");
    }
    setUploading(false);
  };

  // ← ADDED: ask handler
  const handleAsk = async (q = query) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setAnswer(null);
    setConflicts(null);
    setAnswerSources([]);
    try {
      const [askRes, conflictRes] = await Promise.all([
        fetch(`${API}/ask/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) }),
        fetch(`${API}/conflicts/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: q, top_k: 8 }) })
      ]);
      const askData = await askRes.json();
      const conflictData = await conflictRes.json();
      setAnswer(askData.answer);
      setAnswerSources([...new Set((askData.sources || []).map(s => s.filename))]);
      const ct = conflictData.conflicts || "";
      if (!ct.toLowerCase().includes("no conflict")) setConflicts(ct);
    } catch {
      setAnswer("❌ Could not reach backend. Make sure it's running on localhost:8000.");
    }
    setLoading(false);
  };

  return (
    <>

      {/* Background Layer */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#020617', // deep navy
          zIndex: -2,
        }}
      />

      {/* Aurora Layer */}
      <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: -1 }}>
        <Aurora
          colorStops={["#312E81", "#6D28D9", "#14532D"]}
          blend={1}
          amplitude={1.0}
          speed={0.7}
        />
      </div>

      {/* Top left Logo */}
      <img
        src={logo}
        alt="Corpus Mind"
        style={{
          position: 'fixed',
          top: '30px',
          left: '30px',
          width: '200px',
          height: '80px',
          zIndex: 1000,
        }}
      />

      {/* Gooey Nav */}
      <div style={{ top: '20px', left: '590px', height: '70px', position: 'fixed', zIndex: 9999 }}>
        <GooeyNav
          onPageChange={setPage} items={items}
          particleCount={15}
          particleDistances={[90, 10]}
          particleR={100}
          initialActiveIndex={0}
          animationTime={300}
          timeVariance={300}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />
      </div>

      {/* Click Spark */}
      {/*<ClickSpark
        sparkColor="#ffffff"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
      </ClickSpark>*/}

      {/* ← ADDED: hidden file input */}
      <input id="fileUpload" type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={handleUpload} />

      {page === "home" && (
        <>

          {/* Split Text */}
          <div
            style={{
              whiteSpace: 'nowrap',
              position: 'fixed',
              top: '130px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
            }}
          >
            <SplitText
              text="Your Institution's Collective Memory"
              className="text-5xl font-semibold text-white text-center whitespace-nowrap w-max"
              delay={10}
              duration={0.15}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
              onLetterAnimationComplete={handleAnimationComplete}
              showCallback
            />
          </div>

          {/* Plain text */}
          <div
            style={{
              position: 'fixed',
              top: '205px',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              zIndex: 100,
              maxWidth: '2000px',
            }}
          >
            <p
              className="font-semibold w-max"
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '1.3rem',
                lineHeight: '1.6',
                margin: 0,
                fontWeight: 400,
              }}
            >
              Search, connect and preserve institutional knowledge across
              documents, emails and policies.
            </p>
          </div>

          {/* Magic Bento */}
          <div style={{
            top: '300px',
            left: '270px',
            position: 'fixed',
            width: '100%',
            maxWidth: '1200px'
          }}>
            <MagicBento
              textAutoHide={false}
              enableStars={false}
              enableSpotlight
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={false}
              spotlightRadius={400}
              particleCount={0}
              glowColor="132, 0, 255"
              disableAnimations={false}
            />
          </div>

          {/* Spotlight Card — ← MODIFIED: shows upload status */}
          <div
            onClick={() => document.getElementById('fileUpload').click()}
            style={{
              cursor: 'pointer',
              top: '580px',
              left: '270px',
              position: 'fixed',
              width: '100%',
              maxWidth: '1000px'
            }}>
            <SpotlightCard className="custom-spotlight-card" spotlightColor="rgba(132, 0, 255, 0.25)">
              <h2><b>↟ UPLOAD DOCUMENTS</b></h2>
              <br></br>
              <p>{uploading ? "⏳ Indexing..." : uploadMsg || "Build your institution's knowledge base from PDFs, DOCX files, emails and policies."}</p>
            </SpotlightCard>
          </div>
        </>
      )}

      {page === "demo" && (
        <>
          <div
            style={{
              textAlign: "center",
              color: "white",
              paddingTop: "125px",
              paddingBottom: "100px",
              minHeight: "100vh",
            }}
          >
            <SplitText
              text="Institutional Search Engine"
              className="text-5xl font-semibold text-white text-center whitespace-nowrap w-max"
              delay={10}
              duration={0.15}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-200px"
              textAlign="center"
              onLetterAnimationComplete={handleAnimationComplete}
              showCallback
            />

            <p
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "1.4rem",
                margin: "20px 0 20px 0",
              }}
            >
              Find answers hidden across thousands of documents.
            </p>

            {/* ← MODIFIED: wired up value, onChange, onKeyDown */}
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAsk()}
              placeholder="Ask a question about your institution..."
              style={{
                width: "700px",
                padding: "18px",
                borderRadius: "15px",
                border: "1px solid #444",
                background: "#120F17",
                color: "white",
                fontSize: "1rem",
              }}
            />

            {/* ← MODIFIED: suggestion chips now trigger real search */}
            <div
              style={{
                marginTop: "25px",
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {[
                "What is the minimum attendance requirement?",
                "Which policy was updated most recently?",
                "Show conflicting leave policies",
                "What is the reimbursement limit?"
              ].map((item) => (
                <div
                  key={item}
                  onClick={() => handleAsk(item)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "20px",
                    background: "#120F17",
                    border: "1px solid #333",
                    cursor: "pointer",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* ← MODIFIED: answer card shows real data */}
            {loading && (
              <div style={{ marginTop: "50px", color: "rgba(255,255,255,0.6)", fontSize: "1.1rem" }}>
                ⏳ Searching corpus and reasoning across documents...
              </div>
            )}

            {answer && !loading && (
              <div
                style={{
                  width: "900px",
                  margin: "50px auto",
                  background: "#120F17",
                  borderRadius: "20px",
                  padding: "30px",
                  textAlign: "left",
                }}
              >
                <h2>Answer</h2>
                <p style={{ fontSize: "1.2rem", whiteSpace: "pre-wrap" }}>{answer}</p>

                {answerSources.length > 0 && (
                  <>
                    <h3>Sources</h3>
                    <ul>{answerSources.map(s => <li key={s}>{s}</li>)}</ul>
                  </>
                )}
              </div>
            )}

            {/* ← MODIFIED: conflict card shows real data, only when conflicts found */}
            {conflicts && !loading && (
              <div
                style={{
                  width: "900px",
                  margin: "20px auto",
                  background: "#120F17",
                  borderRadius: "20px",
                  padding: "30px",
                  textAlign: "left",
                  border: "1px solid #ff9f43",
                }}
              >
                <h2>⚠ Conflict Detected</h2>
                <p style={{ whiteSpace: "pre-wrap" }}>{conflicts}</p>
                <p style={{ color: "#ff9f43" }}>Review recommended.</p>
              </div>
            )}
          </div>
        </>
      )}

      {page === "about" && (
        <>
          <div
            style={{
              textAlign: "center",
              color: "white",
              paddingTop: "150px",
              width: "1100px",
              margin: "0 auto",
            }}
          >
            <h1
              style={{
                fontSize: "4rem",
                marginBottom: "30px",
              }}
            >
              About Corpus Mind
            </h1>

            <p
              style={{
                fontSize: "1.3rem",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              <br />
              <br />
              Corpus Mind transforms scattered institutional
              documents into a searchable knowledge layer.
            </p>

            <div style={{ marginTop: "100px" }}>
              <h2>Problem</h2>

              <p
                style={{
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: "2",
                  fontSize: "1.1rem",
                }}
              >
                Institutions generate thousands of documents,
                emails, reports and policies.
                <br />
                Important knowledge becomes buried,
                duplicated or outdated.
              </p>
            </div>

            <div style={{ marginTop: "80px" }}>
              <h2>Solution</h2>

              <p
                style={{
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: "2",
                  fontSize: "1.1rem",
                }}
              >
                Ask questions in natural language.
                <br />
                Discover hidden knowledge.
                <br />
                Detect contradictions across documents.
                <br />
                Surface important institutional insights.
              </p>
            </div>

            <div style={{ marginTop: "80px" }}>
              <h2>Built With</h2>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "20px",
                  marginTop: "30px",
                }}
              >
                {["React", "Node.js", "MongoDB", "Elasticsearch"].map((tech) => (
                  <div
                    key={tech}
                    style={{
                      background: "#120F17",
                      padding: "20px 30px",
                      borderRadius: "15px",
                      border: "1px solid #333",
                    }}
                  >
                    {tech}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "100px", marginBottom: "100px" }}>
              <h2>Architecture</h2>

              <div
                style={{
                  lineHeight: "2.2",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "1.1rem",
                }}
              >
                Documents
                <br />↓<br />
                MongoDB Storage
                <br />↓<br />
                Elasticsearch Indexing
                <br />↓<br />
                Natural Language Search
                <br />↓<br />
                Answers & Insights
              </div>
            </div>
          </div>
        </>
      )}


    </>
  )
}

export default App
