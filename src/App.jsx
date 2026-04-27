import { useState, useEffect, useRef } from 'react';
import './index.css';
import ApiKeyScreen from './components/ApiKeyScreen';
import DecisionScreen from './components/DecisionScreen';
import MatrixScreen from './components/MatrixScreen';
import DebateScreen from './components/DebateScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer, initToast } from './utils/toast.jsx';
import { decodeShareURL } from './utils/export.js';

const SCREENS = { API_KEY: 'API_KEY', DECISION: 'DECISION', MATRIX: 'MATRIX', DEBATE: 'DEBATE' };
const STORAGE_KEY = 'dm_state';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [toasts, setToasts] = useState([]);

  // Register toast setter once on mount (avoids calling side-effect during render)
  useEffect(() => {
    initToast(setToasts);
  }, []);

  // Compute initial state once via lazy initializers — not re-run on every render
  const [pendingSharedData] = useState(() => decodeShareURL());
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('dm_gemini_key') || '');
  const [apiModel, setApiModel] = useState(() => localStorage.getItem('dm_gemini_model') || 'gemini-2.5-flash');
  const [matrixData, setMatrixData] = useState(() => {
    const shared = decodeShareURL();
    return shared || loadSaved();
  });
  const [screen, setScreen] = useState(() => {
    const shared = decodeShareURL();
    const key = localStorage.getItem('dm_gemini_key') || '';
    if (shared) return key ? SCREENS.MATRIX : SCREENS.API_KEY;
    return key ? SCREENS.DECISION : SCREENS.API_KEY;
  });

  // Clean share param from URL once, without page reload
  const urlCleaned = useRef(false);
  useEffect(() => {
    if (urlCleaned.current) return;
    urlCleaned.current = true;
    if (window.location.search.includes('share=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('share');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Persist matrix to localStorage whenever it changes
  useEffect(() => {
    if (matrixData) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(matrixData));
      } catch {
        // Storage quota exceeded — silently ignore
      }
    }
  }, [matrixData]);

  function handleApiKeySet({ key, model }) {
    setApiKey(key);
    setApiModel(model);
    if (pendingSharedData) {
      setMatrixData(pendingSharedData);
      setScreen(SCREENS.MATRIX);
    } else {
      setScreen(SCREENS.DECISION);
    }
  }

  function handleMatrixGenerated(data) {
    setMatrixData(data);
    setScreen(SCREENS.MATRIX);
  }

  function handleMatrixChange(partial) {
    setMatrixData((prev) => ({ ...prev, ...partial }));
  }

  function handleProceedToDebate(dataWithWinner) {
    setMatrixData(dataWithWinner);
    setScreen(SCREENS.DEBATE);
  }

  function handleStartOver() {
    localStorage.removeItem(STORAGE_KEY);
    setMatrixData(null);
    setScreen(SCREENS.DECISION);
  }

  function handleChangeKey() {
    localStorage.removeItem('dm_gemini_key');
    setApiKey('');
    setScreen(SCREENS.API_KEY);
  }

  function dismissToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ErrorBoundary>
      <div className="app-wrapper">
        {/* Top bar — hidden on API key screen */}
        {screen !== SCREENS.API_KEY && (
          <header className="topbar" role="banner">
            <div className="topbar-brand" aria-label="Decision Matrix Home">
              <span aria-hidden="true">⚡</span> Decision<span className="brand-dot">Matrix</span>
            </div>
            <nav className="topbar-actions" aria-label="App navigation">
              <span className="chip" aria-label="Powered by Gemini 2.5">🤖 Gemini 2.5</span>
              {screen !== SCREENS.DECISION && (
                <button
                  id="btn-new-decision"
                  className="btn btn-ghost btn-sm"
                  onClick={handleStartOver}
                  title="Start a new decision"
                >
                  ＋ New Decision
                </button>
              )}
              <button
                id="btn-change-key"
                className="btn btn-ghost btn-sm"
                onClick={handleChangeKey}
                title="Change your Gemini API Key"
              >
                🔑 API Key
              </button>
            </nav>
          </header>
        )}

        <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {screen === SCREENS.API_KEY && (
            <ApiKeyScreen onApiKeySet={handleApiKeySet} hasPendingShare={!!pendingSharedData} />
          )}

          {screen === SCREENS.DECISION && (
            <div style={{ padding: '2rem 1.5rem', flex: 1 }}>
              <DecisionScreen
                apiKey={apiKey}
                apiModel={apiModel}
                onMatrixGenerated={handleMatrixGenerated}
                onBack={() => setScreen(SCREENS.API_KEY)}
              />
            </div>
          )}

          {screen === SCREENS.MATRIX && matrixData && (
            <div style={{ padding: '2rem 1.5rem', flex: 1 }}>
              <MatrixScreen
                data={matrixData}
                onDataChange={handleMatrixChange}
                onProceedToDebate={handleProceedToDebate}
                onBack={() => setScreen(SCREENS.DECISION)}
              />
            </div>
          )}

          {screen === SCREENS.DEBATE && matrixData && (
            <div style={{ padding: '2rem 1.5rem', flex: 1 }}>
              <DebateScreen
                apiKey={apiKey}
                apiModel={apiModel}
                data={matrixData}
                onBack={() => setScreen(SCREENS.MATRIX)}
                onStartOver={handleStartOver}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        {screen !== SCREENS.API_KEY && (
          <footer className="app-footer" role="contentinfo">
            <span>⚡ Decision Matrix</span>
            <span className="footer-sep">·</span>
            <span>Powered by Gemini 2.5 Flash</span>
            <span className="footer-sep">·</span>
            <span>Your data stays in your browser</span>
          </footer>
        )}

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ErrorBoundary>
  );
}
