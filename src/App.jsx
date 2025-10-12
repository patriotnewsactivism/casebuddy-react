import React, { useState, useEffect, useMemo, useRef } from 'react';

// Generate a simple unique identifier based on timestamp and randomness.
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

/**
 * CaseBuddy React portal with authentication, navigation and AI tools.
 *
 * This version extends the basic case manager to support multi-user accounts,
 * login/sign‑up, a top navigation menu, and an AI tools section. Each user’s
 * data is kept separate in localStorage. A simple search and summary
 * generator provide quick insights into a case without external APIs.
 */
export default function App() {
  // --------- Authentication state ---------
  const [users, setUsers] = useState([]); // list of { username, password }
  const [currentUser, setCurrentUser] = useState(null); // string username
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // --------- App view state ---------
  const [view, setView] = useState('cases'); // 'cases' | 'ai' | 'account'

  // --------- Case management state ---------
  const [cases, setCases] = useState([]);
  const [currentCaseId, setCurrentCaseId] = useState(null);

  // New case form
  const [caseTitle, setCaseTitle] = useState('');
  const [caseDescription, setCaseDescription] = useState('');

  // Search query
  const [query, setQuery] = useState('');

  // Document form
  const [docName, setDocName] = useState('');
  const docFileRef = useRef(null);

  // Evidence form
  const [evName, setEvName] = useState('');
  const evFileRef = useRef(null);

  // Timeline event form
  const [tlDate, setTlDate] = useState('');
  const [tlTitle, setTlTitle] = useState('');
  const [tlDesc, setTlDesc] = useState('');

  // FOIA form
  const [foiaSubject, setFoiaSubject] = useState('');
  const [foiaDesc, setFoiaDesc] = useState('');

  // --------- AI tools state ---------
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState([]);
  const [aiSummary, setAiSummary] = useState('');

  // --------- Initialization ---------
  // Load users and current user on mount
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed)) setUsers(parsed);
      }
      const storedCurrentUser = localStorage.getItem('currentUser');
      if (storedCurrentUser) {
        setCurrentUser(storedCurrentUser);
      }
    } catch (err) {
      console.warn('Failed to load user data', err);
    }
  }, []);

  // Whenever currentUser changes, load that user’s cases
  useEffect(() => {
    if (currentUser) {
      try {
        const storedCases = localStorage.getItem(`cases_${currentUser}`);
        if (storedCases) {
          const parsed = JSON.parse(storedCases);
          if (Array.isArray(parsed)) {
            setCases(parsed);
            if (parsed.length > 0) setCurrentCaseId(parsed[0].id);
          } else {
            setCases([]);
          }
        } else {
          setCases([]);
        }
      } catch (err) {
        console.warn('Failed to load cases for user', currentUser, err);
        setCases([]);
      }
    } else {
      setCases([]);
    }
  }, [currentUser]);

  // Save users to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('users', JSON.stringify(users));
    } catch (err) {
      console.error('Unable to persist users', err);
    }
  }, [users]);

  // Save cases for currentUser whenever cases change
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(
          `cases_${currentUser}`,
          JSON.stringify(cases)
        );
      } catch (err) {
        console.error('Unable to persist cases for user', currentUser, err);
      }
    }
  }, [cases, currentUser]);

  // --------- Derived data ---------
  const currentCase = useMemo(
    () => cases.find((c) => c.id === currentCaseId) || null,
    [cases, currentCaseId]
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    for (const cs of cases) {
      if (cs.title && cs.title.toLowerCase().includes(q)) {
        results.push({ type: 'Case', label: cs.title, caseId: cs.id });
      }
      for (const d of cs.documents || []) {
        if (d.name && d.name.toLowerCase().includes(q)) {
          results.push({ type: 'Document', label: d.name, caseId: cs.id });
        }
      }
      for (const ev of cs.evidence || []) {
        if (ev.name && ev.name.toLowerCase().includes(q)) {
          results.push({ type: 'Evidence', label: ev.name, caseId: cs.id });
        }
      }
      for (const ev of cs.timeline || []) {
        const tHit = ev.title && ev.title.toLowerCase().includes(q);
        const dHit = ev.description && ev.description.toLowerCase().includes(q);
        if (tHit || dHit) {
          results.push({ type: 'Timeline', label: `${ev.date}: ${ev.title}`, caseId: cs.id });
        }
      }
      for (const fr of cs.foia || []) {
        const sHit = fr.subject && fr.subject.toLowerCase().includes(q);
        const dHit2 = fr.description && fr.description.toLowerCase().includes(q);
        if (sHit || dHit2) {
          results.push({ type: 'FOIA', label: fr.subject, caseId: cs.id });
        }
      }
    }
    return results;
  }, [cases, query]);

  // --------- Utility functions ---------
  function toDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  function mutateCurrentCase(mutator) {
    setCases((prev) => {
      const next = prev.map((c) => ({ ...c }));
      const idx = next.findIndex((c) => c.id === currentCaseId);
      if (idx === -1) return prev;
      const cs = {
        ...next[idx],
        documents: [...(next[idx].documents || [])],
        evidence: [...(next[idx].evidence || [])],
        timeline: [...(next[idx].timeline || [])],
        foia: [...(next[idx].foia || [])],
      };
      mutator(cs);
      next[idx] = cs;
      return next;
    });
  }

  // --------- Authentication handlers ---------
  function handleSignup(e) {
    e.preventDefault();
    const username = authUsername.trim();
    const password = authPassword;
    if (!username || !password) return;
    if (users.find((u) => u.username === username)) {
      alert('Username already exists. Please choose another.');
      return;
    }
    const newUser = { username, password: btoa(password) };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(username);
    localStorage.setItem('currentUser', username);
    setAuthUsername('');
    setAuthPassword('');
    setAuthMode('login');
  }

  function handleLogin(e) {
    e.preventDefault();
    const username = authUsername.trim();
    const password = authPassword;
    const user = users.find((u) => u.username === username);
    if (!user || btoa(password) !== user.password) {
      alert('Invalid username or password.');
      return;
    }
    setCurrentUser(username);
    localStorage.setItem('currentUser', username);
    setAuthUsername('');
    setAuthPassword('');
  }

  function handleLogout() {
    // Save cases already persisted in effect
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setView('cases');
    setCurrentCaseId(null);
  }

  // --------- Event handlers for cases ---------
  function handleAddCase(e) {
    e.preventDefault();
    if (!currentUser) return;
    const title = caseTitle.trim();
    if (!title) return;
    const newCase = {
      id: uuid(),
      title,
      description: caseDescription.trim(),
      documents: [],
      evidence: [],
      timeline: [],
      foia: [],
    };
    setCases((prev) => [newCase, ...prev]);
    setCurrentCaseId(newCase.id);
    setCaseTitle('');
    setCaseDescription('');
  }

  function selectCase(id) {
    setCurrentCaseId(id);
    setView('cases');
  }

  async function handleAddDocument(e) {
    e.preventDefault();
    if (!currentCase) return;
    const name = docName.trim();
    if (!name) return;
    const doc = { id: uuid(), name };
    const fileEl = docFileRef.current;
    if (fileEl && fileEl.files && fileEl.files[0]) {
      const file = fileEl.files[0];
      doc.content = await toDataUrl(file);
      fileEl.value = '';
    }
    mutateCurrentCase((cs) => {
      cs.documents.push(doc);
    });
    setDocName('');
  }

  async function handleAddEvidence(e) {
    e.preventDefault();
    if (!currentCase) return;
    const name = evName.trim();
    if (!name) return;
    const ev = { id: uuid(), name };
    const fileEl = evFileRef.current;
    if (fileEl && fileEl.files && fileEl.files[0]) {
      const file = fileEl.files[0];
      ev.content = await toDataUrl(file);
      fileEl.value = '';
    }
    mutateCurrentCase((cs) => {
      cs.evidence.push(ev);
    });
    setEvName('');
  }

  function handleAddTimeline(e) {
    e.preventDefault();
    if (!currentCase) return;
    const title = tlTitle.trim();
    if (!title) return;
    const date = tlDate || new Date().toISOString().split('T')[0];
    const description = tlDesc.trim();
    const event = { id: uuid(), date, title, description };
    mutateCurrentCase((cs) => {
      cs.timeline.push(event);
    });
    setTlDate('');
    setTlTitle('');
    setTlDesc('');
  }

  function handleAddFoia(e) {
    e.preventDefault();
    if (!currentCase) return;
    const subject = foiaSubject.trim();
    if (!subject) return;
    const description = foiaDesc.trim();
    mutateCurrentCase((cs) => {
      cs.foia.push({ id: uuid(), subject, description });
    });
    setFoiaSubject('');
    setFoiaDesc('');
  }

  function handleSelectSearchResult(r) {
    setCurrentCaseId(r.caseId);
    setQuery('');
    setView('cases');
  }

  // --------- AI tools ---------
  function runAiSearch(e) {
    e.preventDefault();
    const q = aiQuery.trim().toLowerCase();
    if (!q) {
      setAiResults([]);
      return;
    }
    const results = [];
    for (const cs of cases) {
      if (cs.title && cs.title.toLowerCase().includes(q)) {
        results.push({ type: 'Case', text: cs.title, caseId: cs.id });
      }
      for (const d of cs.documents || []) {
        if (d.name && d.name.toLowerCase().includes(q)) {
          results.push({ type: 'Document', text: d.name, caseId: cs.id });
        }
      }
      for (const ev of cs.evidence || []) {
        if (ev.name && ev.name.toLowerCase().includes(q)) {
          results.push({ type: 'Evidence', text: ev.name, caseId: cs.id });
        }
      }
      for (const ev of cs.timeline || []) {
        if ((ev.title && ev.title.toLowerCase().includes(q)) || (ev.description && ev.description.toLowerCase().includes(q))) {
          results.push({ type: 'Timeline', text: `${ev.date}: ${ev.title}` + (ev.description ? ' – ' + ev.description : ''), caseId: cs.id });
        }
      }
      for (const fr of cs.foia || []) {
        if ((fr.subject && fr.subject.toLowerCase().includes(q)) || (fr.description && fr.description.toLowerCase().includes(q))) {
          results.push({ type: 'FOIA', text: `${fr.subject}` + (fr.description ? ' – ' + fr.description : ''), caseId: cs.id });
        }
      }
    }
    setAiResults(results);
  }

  function generateSummary() {
    if (!currentCase) {
      setAiSummary('Select a case first to generate a summary.');
      return;
    }
    let summary = '';
    summary += currentCase.title ? `Case Title: ${currentCase.title}.\n` : '';
    summary += currentCase.description ? `Description: ${currentCase.description}.\n` : '';
    if (currentCase.documents && currentCase.documents.length > 0) {
      summary += `Documents: ${currentCase.documents.map((d) => d.name).join(', ')}.\n`;
    }
    if (currentCase.evidence && currentCase.evidence.length > 0) {
      summary += `Evidence: ${currentCase.evidence.map((e) => e.name).join(', ')}.\n`;
    }
    if (currentCase.timeline && currentCase.timeline.length > 0) {
      summary += 'Timeline: ';
      summary += currentCase.timeline
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((ev) => `${ev.date}: ${ev.title}${ev.description ? ' (' + ev.description + ')' : ''}`)
        .join('; ') + '.\n';
    }
    if (currentCase.foia && currentCase.foia.length > 0) {
      summary += 'FOIA Requests: ';
      summary += currentCase.foia
        .map((fr) => `${fr.subject}${fr.description ? ' (' + fr.description + ')' : ''}`)
        .join('; ') + '.\n';
    }
    setAiSummary(summary);
  }

  // --------- Render ---------
  // If not logged in, show auth forms
  if (!currentUser) {
    return (
      <div className="auth-container">
        <h2>{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
        <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="form">
          <input
            type="text"
            placeholder="Username"
            value={authUsername}
            onChange={(e) => setAuthUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
          />
          <button type="submit">{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
        </form>
        <p>
          {authMode === 'login' ? (
            <>
              Don’t have an account?{' '}
              <a href="#" onClick={() => setAuthMode('signup')}>Sign Up</a>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <a href="#" onClick={() => setAuthMode('login')}>Login</a>
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Top navigation bar */}
      <nav className="navbar">
        <ul>
          <li
            className={view === 'cases' ? 'active' : ''}
            onClick={() => setView('cases')}
          >
            Cases
          </li>
          <li
            className={view === 'ai' ? 'active' : ''}
            onClick={() => setView('ai')}
          >
            AI Tools
          </li>
          <li
            className={view === 'account' ? 'active' : ''}
            onClick={() => setView('account')}
          >
            Account
          </li>
        </ul>
        <div className="user-info">
          Logged in as <strong>{currentUser}</strong> &nbsp;
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Header section */}
      <header>
        <h1>CaseBuddy – Case Intelligence Portal</h1>
        <div className="subtitle">
          Organise, analyse and manage your legal cases with ease.
        </div>
      </header>

      {/* Content wrapper with sidebar and main area */}
      <div className="container">
        {/* Sidebar visible in cases and ai views */}
        {view === 'cases' && (
          <aside>
            <h2>Cases</h2>
            <ul className="list">
              {cases.length === 0 ? (
                <li style={{ listStyle: 'none', color: '#666', fontStyle: 'italic' }}>
                  No cases yet
                </li>
              ) : (
                cases.map((cs) => (
                  <li
                    key={cs.id}
                    className={cs.id === currentCaseId ? 'active' : ''}
                    onClick={() => selectCase(cs.id)}
                  >
                    {cs.title || 'Untitled case'}
                  </li>
                ))
              )}
            </ul>
            <h3>Add New Case</h3>
            <form className="form" onSubmit={handleAddCase}>
              <input
                type="text"
                placeholder="Case title"
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Case description"
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                rows={3}
              />
              <button type="submit">Add Case</button>
            </form>
            <h3>Search</h3>
            <input
              type="text"
              placeholder="Search across cases…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {searchResults.length > 0 && (
              <ul className="list" style={{ marginTop: '0.5rem' }}>
                {searchResults.map((r, idx) => (
                  <li key={idx} onClick={() => handleSelectSearchResult(r)}>
                    <span style={{ fontWeight: 'bold' }}>{r.type}:</span> {r.label}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}

        {/* Main content area depending on view */}
        <main>
          {/* Cases view */}
          {view === 'cases' && (
            <>
              {!currentCase ? (
                <div id="no-selection">Select a case to view details.</div>
              ) : (
                <>
                  <section>
                    <h3>{currentCase.title || 'Untitled case'}</h3>
                    {currentCase.description && <p>{currentCase.description}</p>}
                  </section>
                  {/* Documents */}
                  <section>
                    <h4>Documents</h4>
                    <ul className="list">
                      {(currentCase.documents ?? []).length === 0 ? (
                        <li>No documents.</li>
                      ) : (
                        currentCase.documents.map((d) => (
                          <li key={d.id}>
                            {d.content ? (
                              <a href={d.content} target="_blank" rel="noreferrer">
                                {d.name}
                              </a>
                            ) : (
                              d.name
                            )}
                          </li>
                        ))
                      )}
                    </ul>
                    <form className="form inline" onSubmit={handleAddDocument}>
                      <input
                        type="text"
                        placeholder="Document name"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        required
                      />
                      <input type="file" ref={docFileRef} accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" />
                      <button type="submit">Add Document</button>
                    </form>
                  </section>
                  {/* Evidence */}
                  <section>
                    <h4>Evidence</h4>
                    <ul className="list">
                      {(currentCase.evidence ?? []).length === 0 ? (
                        <li>No evidence.</li>
                      ) : (
                        currentCase.evidence.map((ev) => (
                          <li key={ev.id}>
                            {ev.content ? (
                              <a href={ev.content} target="_blank" rel="noreferrer">
                                {ev.name}
                              </a>
                            ) : (
                              ev.name
                            )}
                          </li>
                        ))
                      )}
                    </ul>
                    <form className="form inline" onSubmit={handleAddEvidence}>
                      <input
                        type="text"
                        placeholder="Evidence name"
                        value={evName}
                        onChange={(e) => setEvName(e.target.value)}
                        required
                      />
                      <input type="file" ref={evFileRef} accept="image/*,video/*" />
                      <button type="submit">Add Evidence</button>
                    </form>
                  </section>
                  {/* Timeline */}
                  <section>
                    <h4>Timeline</h4>
                    <ul className="list">
                      {[...(currentCase.timeline ?? [])]
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map((ev) => (
                          <li key={ev.id}>
                            <span style={{ fontWeight: 'bold' }}>{ev.date}:</span> {ev.title}
                            {ev.description ? ' – ' + ev.description : ''}
                          </li>
                        ))}
                      {(currentCase.timeline ?? []).length === 0 && <li>No events.</li>}
                    </ul>
                    <form className="form inline" onSubmit={handleAddTimeline}>
                      <input
                        type="date"
                        value={tlDate}
                        onChange={(e) => setTlDate(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Event title"
                        value={tlTitle}
                        onChange={(e) => setTlTitle(e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Event description"
                        value={tlDesc}
                        onChange={(e) => setTlDesc(e.target.value)}
                      />
                      <button type="submit">Add Event</button>
                    </form>
                  </section>
                  {/* FOIA */}
                  <section>
                    <h4>FOIA Requests</h4>
                    <ul className="list">
                      {(currentCase.foia ?? []).length === 0 ? (
                        <li>No FOIA requests.</li>
                      ) : (
                        currentCase.foia.map((fr) => (
                          <li key={fr.id}>
                            <span style={{ fontWeight: 'bold' }}>{fr.subject}</span>
                            {fr.description ? ' – ' + fr.description : ''}
                          </li>
                        ))
                      )}
                    </ul>
                    <form className="form inline" onSubmit={handleAddFoia}>
                      <input
                        type="text"
                        placeholder="Request subject"
                        value={foiaSubject}
                        onChange={(e) => setFoiaSubject(e.target.value)}
                        required
                      />
                      <textarea
                        placeholder="Request description"
                        value={foiaDesc}
                        onChange={(e) => setFoiaDesc(e.target.value)}
                        rows={2}
                      />
                      <button type="submit">Add FOIA Request</button>
                    </form>
                  </section>
                </>
              )}
            </>
          )}
          {/* AI Tools view */}
          {view === 'ai' && (
            <div className="ai-tools">
              <h2>AI Tools</h2>
              <p>Use these tools to gain quick insights and summaries on your cases.</p>
              <form onSubmit={runAiSearch} className="form">
                <input
                  type="text"
                  placeholder="Ask a question or search across all cases…"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                />
                <button type="submit">Search</button>
              </form>
              {aiResults.length > 0 && (
                <div className="ai-results">
                  <h4>Search Results</h4>
                  <ul className="list">
                    {aiResults.map((res, idx) => (
                      <li key={idx} onClick={() => selectCase(res.caseId)}>
                        <span style={{ fontWeight: 'bold' }}>{res.type}:</span> {res.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="ai-summary">
                <h4>Case Summary</h4>
                <p>Generate a concise summary of the currently selected case.</p>
                <button onClick={generateSummary}>Generate Summary</button>
                {aiSummary && <pre style={{ whiteSpace: 'pre-wrap' }}>{aiSummary}</pre>}
              </div>
            </div>
          )}
          {/* Account view */}
          {view === 'account' && (
            <div className="account-section">
              <h2>Account Settings</h2>
              <p>Username: <strong>{currentUser}</strong></p>
              <p>Your data is stored locally in your browser. Logging out will simply clear your session.</p>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </main>
      </div>

      <footer>
        © {new Date().getFullYear()} CaseBuddy – All rights reserved.
      </footer>
    </div>
  );
}