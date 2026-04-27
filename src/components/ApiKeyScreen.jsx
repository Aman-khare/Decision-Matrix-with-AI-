import { useState } from 'react';

export default function ApiKeyScreen({ onApiKeySet, hasPendingShare }) {
  const [key, setKey] = useState(localStorage.getItem('dm_gemini_key') || '');
  const [model, setModel] = useState(localStorage.getItem('dm_gemini_model') || 'gemini-2.5-flash');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) { setError('Please enter your Gemini API key.'); return; }
    if (!trimmed.startsWith('AI')) {
      setError('That doesn\'t look like a Gemini API key (should start with "AI…").');
      return;
    }
    setLoading(true);
    setError('');

    // Quick validation call
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmed}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "ok".' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Invalid API key or quota exceeded.');
      }
      localStorage.setItem('dm_gemini_key', trimmed);
      localStorage.setItem('dm_gemini_model', model);
      onApiKeySet({ key: trimmed, model });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen content-layer" role="main">
      <div className="glow-bg glow-1" aria-hidden="true" />
      <div className="glow-bg glow-2" aria-hidden="true" />

      <div className="card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-badge" aria-label="Powered by Gemini 2.5">⚡ Powered by Gemini 2.5</div>
          <h1 style={{ marginBottom: '0.5rem' }}>
            Decision<span className="gradient-text">Matrix</span>
          </h1>
          <p>
            AI-powered weighted decision analysis. Describe your choices —
            let Gemini build the matrix and debate the winner.
          </p>
        </div>

        {hasPendingShare && (
          <div className="alert alert-success" role="status" style={{ marginBottom: '1.25rem' }}>
            🔗 A shared decision matrix is waiting — enter your API key to view it.
          </div>
        )}

        <form onSubmit={handleSave} noValidate>
          {error && (
            <div className="alert alert-error" role="alert" aria-live="assertive">{error}</div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="apimodel">Gemini Model</label>
            <select
              id="apimodel"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text1)',
                appearance: 'none',
              }}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Default)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Smarter & Slower)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro Experimental</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="apikey">Gemini API Key</label>
            <div style={{ position: 'relative' }}>
              <input
                id="apikey"
                type={show ? 'text' : 'password'}
                placeholder="AIza…"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                style={{ paddingRight: '3.5rem' }}
                autoComplete="off"
                aria-describedby="apikey-hint"
                aria-invalid={!!error}
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide API key' : 'Show API key'}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text3)', fontSize: '0.85rem', padding: '0.25rem',
                }}
              >
                {show ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div id="apikey-hint" className="alert alert-info" style={{ fontSize: '0.82rem', marginBottom: '1.5rem' }}>
            🔒 Your key is stored only in your browser&apos;s localStorage. It is never sent anywhere
            except directly to the Google Gemini API.
          </div>

          <button
            id="btn-submit-key"
            className="btn btn-primary btn-full"
            type="submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <><div className="spinner" aria-hidden="true" /> Validating key…</>
            ) : (
              '→ Continue to Decision Builder'
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.82rem', color: 'var(--accent2)', textDecoration: 'none' }}
            aria-label="Get a free Gemini API key at Google AI Studio (opens in new tab)"
          >
            Don&apos;t have a key? Get one free at Google AI Studio →
          </a>
        </div>
      </div>
    </div>
  );
}
