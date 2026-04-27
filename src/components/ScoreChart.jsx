import { useMemo } from 'react';

// ──────────────────────────────────────────
// Bar Chart: visual score comparison
// ──────────────────────────────────────────
export default function ScoreChart({ totals, winnerId }) {
  const maxScore = useMemo(() => Math.max(...totals.map((t) => t.total), 1), [totals]);
  const sorted = useMemo(() => [...totals].sort((a, b) => b.total - a.total), [totals]);

  return (
    <div className="chart-container" role="img" aria-label="Bar chart of option scores">
      <div className="section-title" style={{ marginBottom: '1rem' }}>Score Comparison</div>
      <div className="chart-bars">
        {sorted.map((t, i) => {
          const isWinner = t.id === winnerId;
          const pct = (t.total / maxScore) * 100;
          return (
            <div key={t.id} className="chart-row">
              <div className="chart-label" title={t.name}>
                {isWinner && <span style={{ marginRight: '0.3rem' }}>🏆</span>}
                {t.name}
              </div>
              <div className="chart-bar-track">
                <div
                  className={`chart-bar-fill ${isWinner ? 'chart-bar-winner' : ''}`}
                  style={{
                    width: `${pct}%`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                  aria-label={`${t.name}: ${t.total.toFixed(2)}`}
                />
              </div>
              <div className="chart-value" style={{ color: isWinner ? 'var(--green)' : 'var(--text2)' }}>
                {t.total.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
