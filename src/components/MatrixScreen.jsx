import { useState, useMemo } from 'react';
import ScoreChart from './ScoreChart';
import { exportCSV, encodeShareURL, copyToClipboard } from '../utils/export.js';
import { toast } from '../utils/toast.jsx';

// ──────────────────────────────────────────
// Helper: compute weighted totals + winner
// ──────────────────────────────────────────
export function computeResults(options, criteria, scores) {
  const totals = options.map((opt) => {
    const total = criteria.reduce((sum, cr) => {
      const raw = parseFloat(scores[`${opt.id}_${cr.id}`]) || 0;
      const w = parseFloat(cr.weight) || 0;
      return sum + (raw * w) / 100;
    }, 0);
    return { id: opt.id, name: opt.name, total };
  });
  const maxTotal = Math.max(...totals.map((t) => t.total));
  const winnerId = totals.find((t) => t.total === maxTotal)?.id;
  return { totals, winnerId };
}

export default function MatrixScreen({ data, onDataChange, onProceedToDebate, onBack }) {
  const { options, criteria, scores } = data;
  const [sharing, setSharing] = useState(false);

  const totalWeight = useMemo(
    () => criteria.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0),
    [criteria]
  );

  const { totals, winnerId } = useMemo(
    () => computeResults(options, criteria, scores),
    [options, criteria, scores]
  );

  // ── Field updaters ──
  function updateOptionName(id, name) {
    onDataChange({ options: options.map((o) => (o.id === id ? { ...o, name } : o)) });
  }

  function updateCriterionName(id, name) {
    onDataChange({ criteria: criteria.map((c) => (c.id === id ? { ...c, name } : c)) });
  }

  function updateWeight(id, weight) {
    onDataChange({ criteria: criteria.map((c) => (c.id === id ? { ...c, weight: Number(weight) } : c)) });
  }

  function updateScore(optId, crId, val) {
    const num = Math.min(10, Math.max(0, parseFloat(val) || 0));
    onDataChange({ scores: { ...scores, [`${optId}_${crId}`]: num } });
  }

  // ── Add / Remove ──
  function addOption() {
    const id = `o${Date.now()}`;
    const newScores = { ...scores };
    criteria.forEach((c) => { newScores[`${id}_${c.id}`] = 5; });
    onDataChange({ options: [...options, { id, name: 'New Option' }], scores: newScores });
    toast('Option added', 'success');
  }

  function removeOption(id) {
    if (options.length <= 2) {
      toast('At least 2 options are required', 'warning');
      return;
    }
    const newScores = { ...scores };
    criteria.forEach((c) => { delete newScores[`${id}_${c.id}`]; });
    onDataChange({ options: options.filter((o) => o.id !== id), scores: newScores });
    toast('Option removed', 'info');
  }

  function addCriterion() {
    const id = `c${Date.now()}`;
    const newScores = { ...scores };
    options.forEach((o) => { newScores[`${o.id}_${id}`] = 5; });
    onDataChange({
      criteria: [...criteria, { id, name: 'New Criterion', weight: 10 }],
      scores: newScores,
    });
    toast('Criterion added', 'success');
  }

  function removeCriterion(id) {
    if (criteria.length <= 2) {
      toast('At least 2 criteria are required', 'warning');
      return;
    }
    const newScores = { ...scores };
    options.forEach((o) => { delete newScores[`${o.id}_${id}`]; });
    onDataChange({ criteria: criteria.filter((c) => c.id !== id), scores: newScores });
    toast('Criterion removed', 'info');
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
      toast(ok ? '🔗 Share link copied to clipboard!' : 'Could not copy — check browser permissions', ok ? 'success' : 'error');
    } else {
      toast('Could not generate share link', 'error');
    }
    setSharing(false);
  }

  function autoBalanceWeights() {
    const equalWeight = Math.floor(100 / criteria.length);
    const remainder = 100 - equalWeight * criteria.length;
    const balanced = criteria.map((c, i) => ({
      ...c,
      weight: equalWeight + (i === 0 ? remainder : 0),
    }));
    onDataChange({ criteria: balanced });
    toast('Weights auto-balanced to 100%', 'success');
  }

  const weightOk = Math.abs(totalWeight - 100) < 0.5;

  return (
    <div
      className="screen-wide content-layer"
      style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}
      role="main"
    >
      <div className="glow-bg glow-1" aria-hidden="true" />
      <div className="glow-bg glow-2" aria-hidden="true" />

      {/* Steps */}
      <nav className="steps" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }} aria-label="Progress steps">
        <div className="step-item done" aria-current="false"><div className="step-num" aria-label="Step 1 complete">✓</div><span>API Key</span></div>
        <div className="step-divider" aria-hidden="true" />
        <div className="step-item done" aria-current="false"><div className="step-num" aria-label="Step 2 complete">✓</div><span>Describe</span></div>
        <div className="step-divider" aria-hidden="true" />
        <div className="step-item active" aria-current="step"><div className="step-num" aria-label="Step 3, current">3</div><span>Matrix</span></div>
        <div className="step-divider" aria-hidden="true" />
        <div className="step-item"><div className="step-num" aria-label="Step 4">4</div><span>Debate</span></div>
      </nav>

      {/* Header */}
      <div className="matrix-header">
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>
            Edit Your <span className="gradient-text">Decision Matrix</span>
          </h1>
          <p style={{ fontSize: '0.88rem' }}>
            Adjust options, criteria, weights and scores. Weights must total 100%.
          </p>
        </div>
        <div className="matrix-actions" role="toolbar" aria-label="Matrix actions">
          <button id="btn-back" className="btn btn-secondary btn-sm" onClick={onBack} aria-label="Back to decision description">← Back</button>
          <button id="btn-add-option" className="btn btn-ghost btn-sm" onClick={addOption} aria-label="Add a new option">＋ Option</button>
          <button id="btn-add-criterion" className="btn btn-ghost btn-sm" onClick={addCriterion} aria-label="Add a new criterion">＋ Criterion</button>
          <button id="btn-export-csv" className="btn btn-ghost btn-sm" onClick={handleExportCSV} aria-label="Export matrix as CSV">↓ CSV</button>
          <button id="btn-share" className="btn btn-ghost btn-sm" onClick={handleShare} disabled={sharing} aria-label="Copy shareable link">
            {sharing ? '…' : '🔗 Share'}
          </button>
          <button
            id="btn-ai-debate"
            className="btn btn-primary btn-sm"
            disabled={!weightOk}
            onClick={() => onProceedToDebate({ ...data, winner: winnerId })}
            title={!weightOk ? 'Weights must sum to 100%' : 'Let AI debate the winner'}
            aria-disabled={!weightOk}
          >
            🤖 AI Debate →
          </button>
        </div>
      </div>

      {/* Weight health bar */}
      <div
        className={`weight-total-bar ${weightOk ? 'weight-ok' : 'weight-warn'}`}
        role="status"
        aria-live="polite"
        aria-label={`Total weight: ${totalWeight.toFixed(0)}%`}
      >
        <span className="weight-total-label">Total weight allocated:</span>
        <span className={`weight-total-value ${weightOk ? 'weight-ok' : 'weight-warn'}`}>
          {totalWeight.toFixed(0)}%
        </span>
        {!weightOk && (
          <>
            <span className="alert alert-yellow" style={{ margin: 0, padding: '0.2rem 0.7rem', fontSize: '0.78rem' }}>
              {totalWeight < 100
                ? `Need ${(100 - totalWeight).toFixed(0)}% more`
                : `${(totalWeight - 100).toFixed(0)}% over budget`}
            </span>
            <button
              id="btn-auto-balance"
              className="btn btn-ghost btn-sm"
              onClick={autoBalanceWeights}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              title="Automatically distribute weights to 100%"
            >
              ⚖ Auto-balance
            </button>
          </>
        )}
        {weightOk && <span className="chip" style={{ color: 'var(--green)' }} aria-label="Weights are balanced">✓ Perfect</span>}
      </div>

      {/* Matrix Table */}
      <div className="card-wide" style={{ marginBottom: '1.5rem' }}>
        <div className="matrix-wrapper" role="region" aria-label="Decision matrix table">
          <table className="matrix-table" aria-label="Weighted decision matrix">
            <thead>
              <tr>
                <th scope="col" style={{ width: 160, minWidth: 160 }}>Option</th>
                {criteria.map((c) => (
                  <th key={c.id} scope="col" className="criterion-header" style={{ textAlign: 'center' }}>
                    <input
                      className="criterion-name-input"
                      value={c.name}
                      onChange={(e) => updateCriterionName(c.id, e.target.value)}
                      style={{ textAlign: 'center', fontWeight: 700 }}
                      aria-label={`Criterion name: ${c.name}`}
                    />
                    <div className="weight-cell">
                      <input
                        className="weight-input"
                        type="number"
                        min={0}
                        max={100}
                        value={c.weight}
                        onChange={(e) => updateWeight(c.id, e.target.value)}
                        aria-label={`Weight for ${c.name}: ${c.weight}%`}
                      />
                      <span className="weight-label">% weight</span>
                    </div>
                    {criteria.length > 2 && (
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ margin: '0 auto 0.25rem', display: 'block', fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => removeCriterion(c.id)}
                        aria-label={`Remove criterion ${c.name}`}
                      >
                        ✕ Remove
                      </button>
                    )}
                  </th>
                ))}
                <th scope="col" style={{ textAlign: 'center', width: 100, background: 'var(--surface)' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {options.map((opt) => {
                const isWinner = opt.id === winnerId;
                const optTotal = totals.find((t) => t.id === opt.id)?.total ?? 0;
                return (
                  <tr key={opt.id} className={isWinner ? 'winner-row' : ''} aria-label={`${opt.name}${isWinner ? ' (winner)' : ''}`}>
                    <td className="option-label-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {isWinner && <span title="Winner" aria-label="Winner">🏆</span>}
                        <input
                          className="option-name-input"
                          value={opt.name}
                          onChange={(e) => updateOptionName(opt.id, e.target.value)}
                          aria-label={`Option name: ${opt.name}`}
                        />
                        {options.length > 2 && (
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ marginRight: '0.5rem', padding: '0.15rem 0.4rem', fontSize: '0.68rem', flexShrink: 0 }}
                            onClick={() => removeOption(opt.id)}
                            aria-label={`Remove option ${opt.name}`}
                          >✕</button>
                        )}
                      </div>
                    </td>
                    {criteria.map((cr) => {
                      const key = `${opt.id}_${cr.id}`;
                      const raw = parseFloat(scores[key]) || 0;
                      const barWidth = `${(raw / 10) * 100}%`;
                      return (
                        <td key={cr.id} className="score-cell">
                          <input
                            className="score-input-cell"
                            type="number"
                            min={0}
                            max={10}
                            step={0.5}
                            value={scores[key] ?? 5}
                            onChange={(e) => updateScore(opt.id, cr.id, e.target.value)}
                            aria-label={`Score for ${opt.name} on ${cr.name}`}
                          />
                          <div
                            className="score-bar"
                            style={{
                              width: barWidth,
                              background:
                                raw >= 7 ? 'var(--green)' : raw >= 4 ? 'var(--accent)' : 'var(--red)',
                            }}
                            aria-hidden="true"
                          />
                        </td>
                      );
                    })}
                    <td className="total-cell" aria-label={`Total score for ${opt.name}: ${optTotal.toFixed(1)}`}>
                      {optTotal.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary + Chart side-by-side on large screens */}
      <div className="results-layout">
        {/* Score cards */}
        <div style={{ flex: 1 }}>
          <div className="section-title">Final Scores</div>
          <div className="results-grid">
            {[...totals].sort((a, b) => b.total - a.total).map((t, i) => (
              <div key={t.id} className={`result-card ${t.id === winnerId ? 'winner' : ''}`} role="article" aria-label={`Rank ${i + 1}: ${t.name} scored ${t.total.toFixed(1)}`}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: '0.3rem' }}>
                  #{i + 1} rank
                </div>
                <div className="result-option-name">{t.name}</div>
                <div className="result-score">{t.total.toFixed(1)}</div>
                {t.id === winnerId && <div className="winner-badge">🏆 Best Choice</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="chart-panel">
          <ScoreChart totals={totals} winnerId={winnerId} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button
          id="btn-ai-debate-bottom"
          className="btn btn-green"
          disabled={!weightOk}
          onClick={() => onProceedToDebate({ ...data, winner: winnerId })}
          aria-disabled={!weightOk}
          title={!weightOk ? 'Weights must sum to 100%' : 'Let AI debate the decision'}
        >
          🤖 Let AI Debate the Decision →
        </button>
      </div>
    </div>
  );
}
