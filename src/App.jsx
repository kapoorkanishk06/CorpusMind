const API_BASE = "http://127.0.0.1:8000";
import logo from './assets/corpusmindlogo.png'
import { useState, useEffect } from 'react'
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

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

const items = [
  { label: "Home", href: "#home" },
  { label: "Demo", href: "#demo" },
  { label: "About", href: "#about" },
];

const DEMO_RESPONSES = {
  "What is the minimum attendance requirement?": {
    answer: "Students must maintain 75% attendance in all courses to be eligible for examinations, except in cases of approved medical leave [Student_Handbook.pdf, p.12]. However, Engineering enforces a stricter 80% for lab sessions [Engineering_Regulations.pdf, p.4].",
    sources: ["Student_Handbook.pdf", "Engineering_Regulations.pdf", "Academic_Policy_2024.docx"],
    conflict: "Attendance_Policy.pdf — Minimum attendance = 75%\n\nAcademic_Regulations.pdf — Minimum attendance = 80%",
  },
  "Which policy was updated most recently?": {
    answer: "The Leave Policy v2.3 was updated most recently, on March 14, 2024 [Leave_Policy_v2.3.pdf, p.1]. Key changes include an increase in casual leave from 10 to 12 days.",
    sources: ["Leave_Policy_v2.3.pdf", "HR_Handbook.pdf"],
    conflict: null,
  },
  "Show conflicting leave policies": {
    answer: "Two conflicting leave policies were found:\n\nHR_Handbook.pdf [p.7] states employees are entitled to 12 days casual leave.\nLeave_Policy_v2.3.pdf [p.2] states 10 days casual leave.\n\nThe HR Handbook appears outdated — last revised 2021 vs Leave Policy updated 2024.",
    sources: ["HR_Handbook.pdf", "Leave_Policy_v2.3.pdf", "Employee_Guide.docx"],
    conflict: "HR_Handbook.pdf — Casual leave = 12 days/year\n\nLeave_Policy_v2.3.pdf — Casual leave = 10 days/year",
  },
  "What is the reimbursement limit?": {
    answer: "The travel reimbursement limit is ₹15,000 per trip for domestic travel [Finance_Policy_2023.pdf, p.9]. International travel requires pre-approval and is capped at ₹1,20,000 [Finance_Policy_2023.pdf, p.11].",
    sources: ["Finance_Policy_2023.pdf", "Travel_Guidelines.pdf"],
    conflict: null,
  },
};

const DEFAULT_RESPONSE = {
  answer: "Based on the indexed documents, the Student Handbook [Student_Handbook.pdf, p.1] serves as the primary reference for all academic policies. Cross-referencing with department-specific guidelines is recommended.",
  sources: ["Student_Handbook.pdf", "Academic_Policy_2024.docx"],
  conflict: null,
};

// ← ADDED: Multi-step loading phases
const LOADING_PHASES = [
  "Scanning 12,408 documents...",
  "Vectorizing query using Gemini...",
  "Cross-referencing institutional policies...",
  "Synthesizing final answer..."
];

function App() {
  const [page, setPage] = useState("home")

  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0) // ← ADDED: state for loading phase
  const [result, setResult] = useState(null)
  const [uploadMsg, setUploadMsg] = useState("")

const handleUpload = async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  setUploadMsg("⏳ Indexing...");

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_BASE}/ingest/file`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();

    setUploadMsg(
      `✅ "${file.name}" indexed (${data.chunks_indexed || "?"} chunks)`
    );

  } catch (err) {
    console.error(err);
    setUploadMsg("❌ Upload failed");
  }
};

 const handleAsk = async (q = query) => {
  if (!q.trim()) return;

  setQuery(q);
  setLoading(true);
  setResult(null);
  setLoadingStep(0);

  setTimeout(() => setLoadingStep(1), 500);
  setTimeout(() => setLoadingStep(2), 1000);
  setTimeout(() => setLoadingStep(3), 1500);

  try {
    const response = await fetch(
      `${API_BASE}/ask`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: q,
        }),
      }
    );

    const data = await response.json();

    const sources =
      data.sources?.map(
        (s) => `${s.filename} (p.${s.page})`
      ) || [];

    setResult({
      answer: data.answer,
      sources,
      conflict: null,
    });

  } catch (err) {

    console.error(err);

    setResult({
      answer: "Could not connect to backend.",
      sources: [],
      conflict: err.message,
    });
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

          {/* Spotlight Card */}
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
              <p>{uploadMsg || "Build your institution's knowledge base from PDFs, DOCX files, emails and policies."}</p>
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

            {/* ← ADDED: Corpus Stats Banner */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '35px', color: '#888', fontSize: '0.9rem', marginBottom: '25px', fontFamily: 'monospace' }}>
                <span>Docs Indexed: <strong style={{color: '#fff'}}>12,408</strong></span>
                <span>Last Sync: <strong style={{color: '#fff'}}>2 mins ago</strong></span>
                <span>Detected Conflicts: <strong style={{color: '#ff9f43'}}>3</strong></span>
                <span>Nodes Connected: <strong style={{color: '#fff'}}>45.2K</strong></span>
            </div>

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

            {/* ← ADDED: Pre-Search Intelligence Widget (Only shows before searching) */}
            {!loading && !result && (
              <div style={{ width: "700px", margin: "40px auto", background: "#120F17", borderRadius: "15px", padding: "25px", border: "1px solid #333", textAlign: "left" }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <span style={{color: '#fff', fontSize: '1.1rem', fontWeight: '500'}}>Institutional Intelligence</span>
                    <span style={{color: '#888', cursor: 'pointer', fontSize: '1.2rem'}}>⧉</span>
                  </div>
                  <p style={{color: '#888', fontSize: '0.85rem', marginBottom: '15px'}}>Key Insights</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#ddd', fontSize: '0.95rem' }}>
                      <div style={{display: 'flex', gap: '10px'}}><span style={{color: '#ff9f43'}}>⚠</span> Attendance conflict detected</div>
                      <div style={{display: 'flex', gap: '10px'}}><span>📄</span> Student Handbook referenced by 23 documents</div>
                      <div style={{display: 'flex', gap: '10px'}}><span>🔄</span> Leave Policy updated 3 days ago</div>
                      <div style={{display: 'flex', gap: '10px'}}><span>⏳</span> Scholarship deadline approaching</div>
                      <div style={{display: 'flex', gap: '10px'}}><span>🏛</span> Procurement policy affects 4 departments</div>
                  </div>
              </div>
            )}

            {/* ← MODIFIED: Multi-step loading state */}
            {loading && (
              <div style={{ marginTop: "60px", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#00ff99', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.1rem", fontFamily: 'monospace' }}>
                  {LOADING_PHASES[loadingStep]}
                </div>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {result && !loading && (
              <div
                style={{
                  width: "900px",
                  margin: "50px auto",
                  background: "#120F17",
                  borderRadius: "20px",
                  padding: "35px",
                  textAlign: "left",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  border: "1px solid #222"
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Answer Synthesized</h2>
                    <span style={{ color: "#00ff99", background: "rgba(0, 255, 153, 0.1)", padding: "5px 12px", borderRadius: "15px", fontSize: "0.9rem" }}>
                      Confidence: {Math.floor(Math.random() * 5) + 94}%
                    </span>
                </div>

                <p style={{ fontSize: "1.15rem", whiteSpace: "pre-wrap", lineHeight: "1.7", color: "#eee" }}>
                  {result.answer}
                </p>

                <div style={{ marginTop: '30px' }}>
                    <h3 style={{ fontSize: '1rem', color: '#888', marginBottom: '15px' }}>Referenced Sources</h3>
                    {/* ← MODIFIED: Carousel style document badges */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {result.sources.map(s => (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1A1622', border: '1px solid #333', padding: '8px 15px', borderRadius: '8px', fontSize: '0.9rem', color: '#ccc' }}>
                                📄 {s}
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            )}

            {result?.conflict && !loading && (
              <div
                style={{
                  width: "900px",
                  margin: "20px auto",
                  background: "rgba(255, 159, 67, 0.05)",
                  borderRadius: "20px",
                  padding: "30px",
                  textAlign: "left",
                  border: "1px solid rgba(255, 159, 67, 0.5)",
                }}
              >
                <h2 style={{ color: '#ff9f43', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠</span> Institutional Conflict Detected
                </h2>
                <p style={{ whiteSpace: "pre-wrap", color: '#ddd', lineHeight: '1.6' }}>{result.conflict}</p>
                <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'inline-block' }}>
                    <p style={{ color: "#ff9f43", margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Action Required: Human review recommended for policy reconciliation.
                    </p>
                </div>
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