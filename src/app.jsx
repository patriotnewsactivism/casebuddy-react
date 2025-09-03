import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * CaseBuddy – React single-file app (drop-in component)
 * ----------------------------------------------------
 * • No external deps beyond React
 * • Persists to localStorage (key: "cases")
 * • Matches the original sections: Cases, Documents, Evidence, Timeline, FOIA
 * • File uploads are stored as base64 data URLs for easy offline viewing
 * • Styling with Tailwind utility classes to approximate the original look
 *
 * HOW TO USE
 * 1) Put this file in src/App.jsx (Vite or CRA). Ensure Tailwind is set up, or
 *    replace classes with your own CSS if you prefer.
 * 2) Render <App /> in main.jsx / index.js.
 * 3) npm run dev (Vite) or npm start (CRA).
 */

// simple unique id
function uuid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
  );
}

export default function App() {
  // ---------- State ----------
  const [cases, setCases] = useState([]);
  const [currentCaseId, setCurrentCaseId] = useState(null);

  // Add Case form
  const [caseTitle, setCaseTitle] = useState("");
  const [caseDescription, setCaseDescription] = useState("");

  // Search
  const [query, setQuery] = useState("");

  // Documents form
  const [docName, setDocName] = useState("");
  const docFileRef = useRef(null);

  // Evidence form
  const [evName, setEvName] = useState("");
  const evFileRef = useRef(null);

  // Timeline form
  const [tlDate, setTlDate] = useState("");
  const [tlTitle, setTlTitle] = useState("");
  const [tlDesc, setTlDesc] = useState("");

  // FOIA form
  const [foiaSubject, setFoiaSubject] = useState("");
  const [foiaDesc, setFoiaDesc] = useState("");

  // ---------- Persistence ----------
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cases");
      const parsed = stored ? JSON.parse(stored) : [];
      setCases(Array.isArray(parsed) ? parsed : []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCurrentCaseId(parsed[0].id);
      }
    } catch (e) {
      console.warn("Failed to read cases from storage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cases", JSON.stringify(cases));
    } catch (e) {
      console.error("Failed to save cases", e);
    }
  }, [cases]);

  // ---------- Derived ----------
  const currentCase = useMemo(
    () => cases.find((c) => c.id === currentCaseId) || null,
    [cases, currentCaseId]
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const res = [];
    for (const cs of cases) {
      if (cs.title && cs.title.toLowerCase().includes(q)) {
        res.push({ type: "Case", title: cs.title, caseId: cs.id });
      }
      for (const d of cs.documents || []) {
        if (d.name?.toLowerCase().includes(q)) {
          res.push({ type: "Document", title: d.name, caseId: cs.id });
        }
      }
      for (const ev of cs.evidence || []) {
        if (ev.name?.toLowerCase().includes(q)) {
          res.push({ type: "Evidence", title: ev.name, caseId: cs.id });
        }
      }
      for (const ev of cs.timeline || []) {
        const hit =
          ev.title?.toLowerCase().includes(q) ||
          ev.description?.toLowerCase().includes(q);
        if (hit) res.push({ type: "Timeline", title: `${ev.date}: ${ev.title}`, caseId: cs.id });
      }
      for (const fr of cs.foia || []) {
        const hit =
          fr.subject?.toLowerCase().includes(q) ||
          fr.description?.toLowerCase().includes(q);
        if (hit) res.push({ type: "FOIA", title: fr.subject, caseId: cs.id });
      }
    }
    return res;
  }, [cases, query]);

  // ---------- Handlers ----------
  function addCase(e) {
    e.preventDefault();
    const title = caseTitle.trim();
    if (!title) return;
    const cs = {
      id: uuid(),
      title,
      description: caseDescription.trim(),
      documents: [],
      evidence: [],
      timeline: [],
      foia: [],
    };
    setCases((prev) => [cs, ...prev]);
    setCurrentCaseId(cs.id);
    setCaseTitle("");
    setCaseDescription("");
  }

  function onSelectCase(id) {
    setCurrentCaseId(id);
  }

  async function addDocument(e) {
    e.preventDefault();
    if (!currentCase) return;
    const name = docName.trim();
    if (!name) return;

    const doc = { id: uuid(), name };
    const fileEl = docFileRef.current;
    if (fileEl?.files?.[0]) {
      const file = fileEl.files[0];
      doc.content = await toDataUrl(file);
      fileEl.value = "";
    }

    mutateCurrentCase((cs) => {
      cs.documents.push(doc);
    });
    setDocName("");
  }

  async function addEvidence(e) {
    e.preventDefault();
    if (!currentCase) return;
    const name = evName.trim();
    if (!name) return;

    const ev = { id: uuid(), name };
    const fileEl = evFileRef.current;
    if (fileEl?.files?.[0]) {
      const file = fileEl.files[0];
      ev.content = await toDataUrl(file);
      fileEl.value = "";
    }

    mutateCurrentCase((cs) => {
      cs.evidence.push(ev);
    });
    setEvName("");
  }

  function addTimeline(e) {
    e.preventDefault();
    if (!currentCase) return;

    const title = tlTitle.trim();
    if (!title) return;
    const date = tlDate || new Date().toISOString().split("T")[0];
    const description = tlDesc.trim();

    mutateCurrentCase((cs) => {
      cs.timeline.push({ id: uuid(), date, title, description });
    });

    setTlDate("");
    setTlTitle("");
    setTlDesc("");
  }

  function addFoia(e) {
    e.preventDefault();
    if (!currentCase) return;

    const subject = foiaSubject.trim();
    if (!subject) return;
    const description = foiaDesc.trim();

    mutateCurrentCase((cs) => {
      cs.foia.push({ id: uuid(), subject, description });
    });

    setFoiaSubject("");
    setFoiaDesc("");
  }

  function mutateCurrentCase(mutator) {
    setCases((prev) => {
      const next = prev.map((c) => ({ ...c }));
      const i = next.findIndex((c) => c.id === currentCaseId);
      if (i === -1) return prev;
      // deep-ish clone of arrays to preserve immutability semantics
      const cs = {
        ...next[i],
        documents: [...(next[i].documents || [])],
        evidence: [...(next[i].evidence || [])],
        timeline: [...(next[i].timeline || [])],
        foia: [...(next[i].foia || [])],
      };
      mutator(cs);
      next[i] = cs;
      return next;
    });
  }

  // file -> base64 data URL
  function toDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="bg-blue-700 text-white px-6 py-4 shadow">
        <h1 className="text-2xl font-semibold">CaseBuddy – Case Intelligence Portal</h1>
        <p className="opacity-80">Organise, analyse and manage your legal cases with ease.</p>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-1/3 lg:w-[28%] min-w-[220px] bg-white border-r border-slate-200 p-4 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-2">Cases</h2>
          <ul className="space-y-2 mb-4">
            {cases.length === 0 ? (
              <li className="text-slate-500 italic">No cases yet</li>
            ) : (
              cases.map((cs) => (
                <li
                  key={cs.id}
                  className={`p-2 rounded border cursor-pointer bg-slate-50 hover:bg-blue-50 ${
                    cs.id === currentCaseId ? "bg-blue-100 border-blue-300" : "border-slate-200"
                  }`}
                  onClick={() => onSelectCase(cs.id)}
                  title={cs.title}
                >
                  {cs.title || "Untitled case"}
                </li>
              ))
            )}
          </ul>

          {/* Add New Case */}
          <h3 className="font-semibold mb-2">Add New Case</h3>
          <form onSubmit={addCase} className="flex flex-col gap-2 mb-6">
            <input
              type="text"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              placeholder="Case title"
              className="border rounded px-2 py-1"
              required
            />
            <textarea
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              placeholder="Case description"
              className="border rounded px-2 py-1"
              rows={3}
            />
            <button className="self-start bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800">
              Add Case
            </button>
          </form>

          {/* Search */}
          <h3 className="font-semibold mb-2">Search</h3>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases, documents, evidence…"
            className="border rounded px-2 py-1 w-full"
          />
          <ul className="mt-2 space-y-1">
            {searchResults.map((r, idx) => (
              <li
                key={idx}
                className="p-2 rounded border border-slate-200 bg-slate-50 cursor-pointer hover:bg-blue-50"
                onClick={() => {
                  setCurrentCaseId(r.caseId);
                  setQuery("");
                }}
              >
                <span className="font-medium">{r.type}:</span> {r.title}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main panel */}
        <main className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Case Details</h2>

          {!currentCase ? (
            <div className="text-slate-500 italic">Select a case to view its details.</div>
          ) : (
            <div className="space-y-8">
              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-semibold" title={currentCase.title}>
                  {currentCase.title || "Untitled case"}
                </h3>
                {currentCase.description && (
                  <p className="text-slate-700">{currentCase.description}</p>
                )}
              </div>

              {/* Documents */}
              <section>
                <h4 className="font-semibold mb-2">Documents</h4>
                <ul className="space-y-1 mb-2">
                  {(currentCase.documents ?? []).length === 0 ? (
                    <li className="text-slate-600">No documents.</li>
                  ) : (
                    currentCase.documents.map((d) => (
                      <li key={d.id} className="p-2 rounded border border-slate-200 bg-slate-50">
                        {d.content ? (
                          <a
                            href={d.content}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 hover:underline break-all"
                          >
                            {d.name}
                          </a>
                        ) : (
                          <span>{d.name}</span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
                <form onSubmit={addDocument} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="Document name"
                    required
                    className="border rounded px-2 py-1 flex-1 min-w-[180px]"
                  />
                  <input
                    type="file"
                    ref={docFileRef}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    className="min-w-[200px]"
                  />
                  <button className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800">
                    Add Document
                  </button>
                </form>
              </section>

              {/* Evidence */}
              <section>
                <h4 className="font-semibold mb-2">Evidence</h4>
                <ul className="space-y-1 mb-2">
                  {(currentCase.evidence ?? []).length === 0 ? (
                    <li className="text-slate-600">No evidence.</li>
                  ) : (
                    currentCase.evidence.map((ev) => (
                      <li key={ev.id} className="p-2 rounded border border-slate-200 bg-slate-50">
                        {ev.content ? (
                          <a
                            href={ev.content}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 hover:underline break-all"
                          >
                            {ev.name}
                          </a>
                        ) : (
                          <span>{ev.name}</span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
                <form onSubmit={addEvidence} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={evName}
                    onChange={(e) => setEvName(e.target.value)}
                    placeholder="Evidence name"
                    required
                    className="border rounded px-2 py-1 flex-1 min-w-[180px]"
                  />
                  <input type="file" ref={evFileRef} accept="image/*,video/*" className="min-w-[200px]" />
                  <button className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800">
                    Add Evidence
                  </button>
                </form>
              </section>

              {/* Timeline */}
              <section>
                <h4 className="font-semibold mb-2">Timeline</h4>
                <ul className="space-y-1 mb-2">
                  {[...(currentCase.timeline ?? [])]
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((ev) => (
                      <li key={ev.id} className="p-2 rounded border border-slate-200 bg-slate-50">
                        <span className="font-medium">{ev.date}:</span> {" "}
                        <span className="font-medium">{ev.title}</span>
                        {ev.description ? <span> — {ev.description}</span> : null}
                      </li>
                    ))}
                  {(currentCase.timeline ?? []).length === 0 && (
                    <li className="text-slate-600">No events.</li>
                  )}
                </ul>
                <form onSubmit={addTimeline} className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={tlDate}
                    onChange={(e) => setTlDate(e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    value={tlTitle}
                    onChange={(e) => setTlTitle(e.target.value)}
                    placeholder="Event title"
                    required
                    className="border rounded px-2 py-1 flex-1 min-w-[180px]"
                  />
                  <input
                    type="text"
                    value={tlDesc}
                    onChange={(e) => setTlDesc(e.target.value)}
                    placeholder="Event description"
                    className="border rounded px-2 py-1 flex-1 min-w-[180px]"
                  />
                  <button className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800">
                    Add Event
                  </button>
                </form>
              </section>

              {/* FOIA */}
              <section>
                <h4 className="font-semibold mb-2">FOIA Requests</h4>
                <ul className="space-y-1 mb-2">
                  {(currentCase.foia ?? []).length === 0 ? (
                    <li className="text-slate-600">No FOIA requests.</li>
                  ) : (
                    currentCase.foia.map((fr) => (
                      <li key={fr.id} className="p-2 rounded border border-slate-200 bg-slate-50">
                        <span className="font-medium">{fr.subject}</span>
                        {fr.description ? <span> — {fr.description}</span> : null}
                      </li>
                    ))
                  )}
                </ul>
                <form onSubmit={addFoia} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={foiaSubject}
                    onChange={(e) => setFoiaSubject(e.target.value)}
                    placeholder="Request subject"
                    required
                    className="border rounded px-2 py-1 flex-1 min-w-[180px]"
                  />
                  <textarea
                    value={foiaDesc}
                    onChange={(e) => setFoiaDesc(e.target.value)}
                    placeholder="Request description"
                    className="border rounded px-2 py-1 flex-1 min-w-[180px]"
                    rows={2}
                  />
                  <button className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800">
                    Add FOIA Request
                  </button>
                </form>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-100 text-center p-2 text-sm border-t border-slate-200">
        © 2025 CaseBuddy – All rights reserved.
      </footer>
    </div>
  );
}
