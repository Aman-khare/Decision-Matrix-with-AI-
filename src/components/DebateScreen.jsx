import { useState, useEffect } from 'react';
import { generateDebate } from '../utils/gemini';
import { computeResults } from './MatrixScreen';
import { exportCSV, encodeShareURL, copyToClipboard } from '../utils/export.js';
import { toast } from '../utils/toast.jsx';

export default function DebateScreen({ apiKey, apiModel, data, onBack, onStartOver }) {
  const [debate, setDebate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);

  const { options, criteria, scores, winner } = data;
  const { totals } = computeResults(options, criteria, scores);
  const winnerOption = options.find((o) => o.id === winner);
  const sorted = [...totals].sort((a, b) => b.total - a.total);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError('');
      try {
        const result = await generateDebate(apiKey, apiModel, data);
        if (!cancelled) setDebate(result);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to generate debate.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function retryDebate() {
    setLoading(true);
    setError('');
    setDebate(null);
    try {
      const result = await generateDebate(apiKey, apiModel, data);
      setDebate(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    exportCSV(data);
    toast('CSV downloaded!', 'success');
  }

  async function handleShare() {
    setSharing(true);
    const url = encodeShareURL(data);
    if (url) {
      const ok = await copyToClipboard(url);
      toast(ok ? '🔗 Share link copied!' : 'Could not copy to clipboard', ok ? 'success' : 'error');
    } else {
      toast('Could not generate share link', 'error');
    }
    setSharing(false);
  }

  return (
    <div
      className="screen-wide content-layer"
      style={{ maxWidth: 900, margin: '0 auto', width: '100%', paddingBottom: '3rem' }}
      role="main"
    >
      <div className="glow-bg glow-1" aria-hidden="true" />
      <div className="glow-bg glow-2" aria-hidden="true" />

      {/* Steps */}
      <nav className="steps" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }} aria-label="Progress steps">
        <div className="step-item done"><div className="step-num">✓</div><span>API Key</span></div>
        <div className="step-divider" aria-hidden="true" />
        <div className="step-item done"><div className="step-num">✓</div><span>Describe</span></div>
        <div className="step-divider" aria-hidden="true" />
        <div className="step-item done"><div className="step-num">✓</div><span>Matrix</span></div>
        <div className="step-divider" aria-hidden="true" />
        <div className="step-item active" aria-current="step"><div className="step-num">4</div><span>Debate</span></div>
      </nav>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>
            AI <span className="gradient-text">Debate</span>
          </h1>
          <p style={{ fontSize: '0.88rem' }}>
            Gemini argues for and against the top choice, then delivers a final verdict.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} role="toolbar" aria-label="Debate actions">
          <button id="btn-back-matrix" className="btn btn-secondary btn-sm" onClick={onBack} aria-label="Back to matrix">← Back to Matrix</button>
          <button id="btn-export-csv-debate" className="btn btn-ghost btn-sm" onClick={handleExportCSV} aria-label="Export as CSV">↓ CSV</button>
          <button id="btn-share-debate" className="btn btn-ghost btn-sm" onClick={handleShare} disabled={sharing} aria-label="Copy shareable link">
            {sharing ? '…' : '🔗 Share'}
          </button>
          <button id="btn-start-over" className="btn btn-ghost btn-sm" onClick={onStartOver} aria-label="Start a new decision">↺ Start Over</button>
        </div>
      </div>

      {/* Winner banner */}
      <div
        className="winner-banner"
        role="region"
        aria-label={`Winner: ${winnerOption?.name}`}
      >
        <div className="winner-trophy" aria-hidden="true">🏆</div>
        <div style={{ flex: 1 }}>
          <div className="winner-label">Matrix Winner</div>
          <div className="winner-name">{winnerOption?.name}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text2)', marginTop: '0.25rem' }}>
            Weighted score:{' '}
            <strong style={{ color: 'var(--green)' }}>{sorted[0]?.total.toFixed(2)}</strong>
            {sorted[1] && (
              <> &nbsp;·&nbsp; Runner-up: <strong>{sorted[1].name}</strong> ({sorted[1].total.toFixed(2)})</>
            )}
          </div>
        </div>

        {/* Ranking pills */}
        <div className="winner-pills" role="list" aria-label="Rankings">
          {sorted.map((t, i) => (
            <div
              key={t.id}
              className={`rank-pill ${i === 0 ? 'rank-pill-first' : ''}`}
              role="listitem"
              aria-label={`Rank ${i + 1}: ${t.name}, score ${t.total.toFixed(1)}`}
            >
              <span className="rank-num">#{i + 1}</span>
              <span className="rank-name">{t.name}</span>
              <span className="rank-score" style={{ color: i === 0 ? 'var(--green)' : 'var(--text2)' }}>
                {t.total.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Debate Section */}
      {loading && (
        <div className="debate-card" role="status" aria-live="polite" aria-label="AI is generating debate">
          <div className="debate-header">
            <div className="debate-icon" aria-hidden="true">🤖</div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Gemini is debating…</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text2)' }}>
                Analyzing trade-offs and constructing arguments…
              </div>
            </div>
          </div>
          <div className="debate-body">
            <div className="thinking-dots" aria-hidden="true">
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '1rem' }} role="alert">
          <div className="alert alert-error">{error}</div>
          <button id="btn-retry-debate" className="btn btn-primary btn-sm" onClick={retryDebate}>↺ Retry</button>
        </div>
      )}

      {debate && !loading && (
        <div className="debate-card" role="region" aria-label="AI Debate results">
          <div className="debate-header">
            <div className="debate-icon" aria-hidden="true">🤖</div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>AI Debate: {winnerOption?.name}</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text2)' }}>
                Gemini argues both sides, then delivers a final verdict.
              </div>
            </div>
            <button
              id="btn-regenerate-debate"
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={retryDebate}
              aria-label="Regenerate debate"
            >
              ↺ Regenerate
            </button>
          </div>
          <div className="debate-body">

            {/* FOR */}
            <section className="debate-section debate-for" aria-label={`Arguments for ${winnerOption?.name}`}>
              <div className="debate-section-title">
                <span aria-hidden="true">✅</span> Arguments FOR {winnerOption?.name}
              </div>
              {(debate.forPoints || []).map((pt, i) => (
                <div key={i} className="debate-point">
                  <div className="debate-point-dot" aria-hidden="true" />
                  <span>{pt}</span>
                </div>
              ))}
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} aria-hidden="true" />

            {/* AGAINST */}
            <section className="debate-section debate-against" aria-label={`Arguments against ${winnerOption?.name}`}>
              <div className="debate-section-title">
                <span aria-hidden="true">⚠️</span> Arguments AGAINST {winnerOption?.name}
              </div>
              {(debate.againstPoints || []).map((pt, i) => (
                <div key={i} className="debate-point">
                  <div className="debate-point-dot" aria-hidden="true" />
                  <span>{pt}</span>
                </div>
              ))}
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} aria-hidden="true" />

            {/* VERDICT */}
            <section className="debate-section debate-verdict" aria-label="Final verdict">
              <div className="debate-section-title">
                <span aria-hidden="true">⚖️</span> Final Verdict
              </div>
              <div className="verdict-box" role="blockquote">{debate.verdict}</div>
            </section>

          </div>
        </div>
      )}

      {/* CTA */}
      {debate && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <button id="btn-adjust-matrix" className="btn btn-secondary" onClick={onBack}>← Adjust Matrix</button>
          <button id="btn-new-decision-debate" className="btn btn-primary" onClick={onStartOver}>🔄 New Decision</button>
        </div>
      )}
    </div>
  );
}
