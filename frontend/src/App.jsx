import React, { useState, useCallback } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://bfhl-fullstack-project.onrender.com';

// ─── Tree Node Component ─────────────────────────────────────────────────────
function TreeNode({ node, children, depth = 0 }) {
  const hasChildren = children && Object.keys(children).length > 0;
  const nodeClass = depth === 0 ? 'root' : hasChildren ? 'intermediate' : 'leaf';
  const icon = depth === 0 ? '⭑' : hasChildren ? '◆' : '●';

  return (
    <div className="tree-node">
      <div className="tree-node-label" data-depth={depth} style={{ opacity: Math.max(0.7, 1 - depth * 0.05) }}
           title={`Depth level: ${depth}`}>
        <span className={`tree-node-label ${nodeClass}`}>
          <span>{icon}</span>
          <span>{node}</span>
        </span>
      </div>
      {hasChildren && (
        <div className="tree-children">
          {Object.entries(children).map(([childKey, grandChildren]) => (
            <div key={childKey} className="tree-connector">
              <TreeNode node={childKey} children={grandChildren} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Hierarchy Card Component ─────────────────────────────────────────────────
function HierarchyCard({ item, index, activeTab }) {
  const isCycle = !!item.has_cycle;
  const treeEntries = item.tree ? Object.entries(item.tree) : [];

  return (
    <div className="glass-card hierarchy-card" style={{ '--index': index }}>
      <div className="hierarchy-header">
        <div className="flex items-center gap-3">
          <div className={`root-badge ${isCycle ? 'cycle' : 'tree'}`}>
            <span className="root-letter">{item.root}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="fw-700" style={{ fontSize: 16 }}>Root: <span className="text-mono">{item.root}</span></span>
              {isCycle
                ? <span className="badge badge-red">⚠ Cycle</span>
                : <span className="badge badge-green">✓ Tree</span>}
            </div>
            {!isCycle && (
              <div className="text-sm text-muted mt-1">
                Depth: <strong style={{ color: 'var(--accent-cyan)' }}>{item.depth}</strong>
              </div>
            )}
            {isCycle && (
              <div className="text-sm mt-1" style={{ color: 'var(--accent-red)' }}>
                Cyclic group detected — no tree structure available
              </div>
            )}
          </div>
        </div>
      </div>

      {!isCycle && activeTab === 'tree' && treeEntries.length > 0 && (
        <div className="tree-view mt-4">
          {treeEntries.map(([rootKey, rootChildren]) => (
            <TreeNode key={rootKey} node={rootKey} children={rootChildren} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Summary Panel ─────────────────────────────────────────────────────────────
function SummaryPanel({ summary }) {
  return (
    <div className="summary-panel">
      <div className="stat-card">
        <div className="stat-value glow-text">{summary.total_trees ?? 0}</div>
        <div className="stat-label">Valid Trees</div>
      </div>
      <div className="stat-card">
        <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{summary.total_cycles ?? 0}</div>
        <div className="stat-label">Cyclic Groups</div>
      </div>
      <div className="stat-card">
        <div className="stat-value" style={{ color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
          {summary.largest_tree_root || '—'}
        </div>
        <div className="stat-label">Largest Tree Root</div>
      </div>
    </div>
  );
}

// ─── Sample Presets ───────────────────────────────────────────────────────────
const PRESETS = [
  {
    label: 'Basic Tree',
    data: '["A->B", "A->C", "B->D", "C->E"]',
  },
  {
    label: 'With Cycle',
    data: '["A->B", "B->C", "C->A"]',
  },
  {
    label: 'Duplicates & Invalid',
    data: '["A->B", "A->B", "1->2", "A->", "B->D", "hello"]',
  },
  {
    label: 'Multi-Parent',
    data: '["A->D", "B->D", "A->E", "C->F"]',
  },
  {
    label: 'Deep Chain',
    data: '["A->B", "B->C", "C->D", "D->E", "E->F"]',
  },
  {
    label: 'Mixed Complex',
    data: '["A->B", "A->C", "B->D", "X->Y", "Y->X", "1->2", "C->B", "B->D"]',
  },
];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tree');

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse(null);
    setError(null);

    let parsedData;
    // Accept comma-separated or JSON array
    try {
      const trimmed = input.trim();
      if (trimmed.startsWith('[')) {
        parsedData = JSON.parse(trimmed);
      } else {
        parsedData = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
    } catch {
      setError('Invalid input format. Use comma-separated values like A->B, B->C or a JSON array.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/bfhl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsedData }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Server returned ${res.status}`);
      }
      const json = await res.json();
      setResponse(json);
    } catch (err) {
      setError(err.message || 'Failed to connect to the server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-group">
            <div className="logo-icon">⬡</div>
            <div>
              <h1 className="logo-title">Hierarchy <span className="glow-text">Processor</span></h1>
              <p className="logo-sub">SRM Full Stack Engineering Challenge</p>
            </div>
          </div>
          <div className="header-badges">
            <span className="badge badge-purple">REST API</span>
            <span className="badge badge-cyan">Node.js</span>
            <span className="badge badge-amber">React</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Input Panel */}
        <section className="glass-card input-panel">
          <div className="flex justify-between items-center mb-4">
            <h2 className="panel-title">Input Edges</h2>
            <span className="text-xs text-muted">Ctrl+Enter to submit</span>
          </div>

          {/* Presets */}
          <div className="presets-row mb-4">
            <span className="text-xs text-muted fw-600" style={{ marginRight: 8, whiteSpace: 'nowrap', alignSelf: 'center' }}>Presets:</span>
            <div className="preset-chips">
              {PRESETS.map((p) => (
                <button key={p.label} className="preset-chip" onClick={() => setInput(p.data)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="edge-input"
            className="edge-textarea"
            placeholder={`Enter edges (comma-separated or JSON array):\n   A->B, A->C, B->D\nor JSON: ["A->B", "A->C", "B->D"]`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={6}
          />

          <div className="input-footer mt-4">
            <div className="format-hints">
              <span className="badge badge-purple">X{'->'} Y format</span>
              <span className="badge badge-cyan">Single uppercase letters only</span>
              <span className="badge badge-amber">No self-loops (A{'->'} A)</span>
            </div>
            <button
              id="submit-btn"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
            >
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }}></span> Processing...</> : <>&#9658; Process Hierarchy</>}
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="error-banner">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {response && (
          <section className="results-section">
            {/* Identity Row */}
            <div className="identity-bar glass-card">
              <div className="identity-item">
                <span className="identity-label">User ID</span>
                <span className="identity-value text-mono">{response.user_id}</span>
              </div>
              <div className="identity-divider" />
              <div className="identity-item">
                <span className="identity-label">Email</span>
                <span className="identity-value">{response.email_id}</span>
              </div>
              <div className="identity-divider" />
              <div className="identity-item">
                <span className="identity-label">Roll No.</span>
                <span className="identity-value text-mono">{response.college_roll_number}</span>
              </div>
            </div>

            {/* Summary */}
            <SummaryPanel summary={response.summary} />

            {/* Invalid & Duplicates */}
            <div className="issues-row">
              <div className="glass-card issues-card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge badge-red">✕ Invalid</span>
                  <span className="text-muted text-sm">({response.invalid_entries?.length ?? 0})</span>
                </div>
                {(response.invalid_entries?.length ?? 0) === 0
                  ? <span className="text-muted text-sm">None</span>
                  : <div className="tag-list">{response.invalid_entries.map((e, i) => (
                      <span key={i} className="tag-item" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.25)' }}>{e || '(empty)'}</span>
                    ))}</div>}
              </div>
              <div className="glass-card issues-card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge badge-amber">⊘ Duplicates</span>
                  <span className="text-muted text-sm">({response.duplicate_edges?.length ?? 0})</span>
                </div>
                {(response.duplicate_edges?.length ?? 0) === 0
                  ? <span className="text-muted text-sm">None</span>
                  : <div className="tag-list">{response.duplicate_edges.map((e, i) => (
                      <span key={i} className="tag-item" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', border: '1px solid rgba(245,158,11,0.25)' }}>{e}</span>
                    ))}</div>}
              </div>
            </div>

            {/* Hierarchies */}
            <div className="glass-card results-main">
              <div className="flex justify-between items-center mb-4">
                <h2 className="panel-title">Hierarchies <span className="badge badge-purple">{response.hierarchies?.length ?? 0} Groups</span></h2>
                <div className="tabs">
                  <button className={`tab-btn ${activeTab === 'tree' ? 'active' : ''}`} onClick={() => setActiveTab('tree')}>🌳 Tree View</button>
                  <button className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`} onClick={() => setActiveTab('json')}>{'{ }'} JSON</button>
                </div>
              </div>

              {activeTab === 'json' ? (
                <pre className="json-block">{JSON.stringify(response, null, 2)}</pre>
              ) : (
                <div className="hierarchies-grid">
                  {(response.hierarchies ?? []).map((item, idx) => (
                    <HierarchyCard key={idx} item={item} index={idx} activeTab={activeTab} />
                  ))}
                  {(response.hierarchies?.length ?? 0) === 0 && (
                    <div className="empty-state">No hierarchies to display. All inputs may be invalid.</div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <span>SRM Full Stack Engineering Challenge · Hierarchy Processor API</span>
        <span className="text-muted">POST /bfhl</span>
      </footer>
    </div>
  );
}
