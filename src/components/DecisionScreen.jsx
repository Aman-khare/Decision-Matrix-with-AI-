import { useState } from 'react';
import { generateMatrix } from '../utils/gemini';

const EXAMPLES = [
  'I need to choose a programming language for my new startup: Python, Go, or JavaScript.',
  'Help me decide between staying at my current job, joining a startup, or freelancing.',
  'I want to pick a city to move to: New York, Austin, Denver, or Seattle.',
  'Which laptop should I buy: MacBook Pro, Dell XPS, or Lenovo ThinkPad?',
];

export default function DecisionScreen({ apiKey, apiModel, onMatrixGenerated, onBack }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e) {
    e.preventDefault();
    const text = input.trim();
    if (text.length < 10) {
      setError('Please describe your decision in more detail (at least a few words).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const matrix = await generateMatrix(apiKey, apiModel, text);
      // Initialize all missing scores to 5
      const allScores = { ...matrix.scores };
      matrix.options.forEach((o) =>
        matrix.criteria.forEach((c) => {
          const k = `${o.id}_${c.id}`;
          if (allScores[k] === undefined) allScores[k] = 5;
        })
      );
      onMatrixGenerated({ ...matrix, scores: allScores, userInput: text });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen content-layer">
      <div className="glow-bg glow-1" />
      <div className="glow-bg glow-2" />

      <div className="card" style={{ maxWidth: 560 }}>
        {/* Steps */}
        <div className="steps" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div className="step-item done">
            <div className="step-num">✓</div>
            <span>API Key</span>
          </div>
          <div className="step-divider" />
          <div className="step-item active">
            <div className="step-num">2</div>
            <span>Describe</span>
          </div>
          <div className="step-divider" />
          <div className="step-item">
            <div className="step-num">3</div>
            <span>Matrix</span>
          </div>
          <div className="step-divider" />
          <div className="step-item">
            <div className="step-num">4</div>
            <span>Debate</span>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '0.4rem' }}>
            What decision are you&nbsp;
            <span className="gradient-text">trying to make?</span>
          </h2>
          <p style={{ fontSize: '0.9rem' }}>
            Describe your options and what you&apos;re comparing. Gemini will create a
            complete weighted matrix for you.
          </p>
        </div>

        <form onSubmit={handleGenerate}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Your Decision</label>
            <textarea
              placeholder="e.g. I need to choose between buying a house now or continuing to rent for 2 more years and investing the down payment instead…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ minHeight: 140 }}
              disabled={loading}
            />
          </div>

          {/* Quick examples */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="section-title">Quick Examples</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn btn-ghost"
                  style={{ textAlign: 'left', fontSize: '0.82rem', padding: '0.5rem 0.8rem' }}
                  onClick={() => setInput(ex)}
                  disabled={loading}
                >
                  💡 {ex}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBack}
              disabled={loading}
            >
              ← Back
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Gemini is thinking…
                </>
              ) : (
                '✨ Generate Matrix'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
