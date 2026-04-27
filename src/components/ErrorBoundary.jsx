import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            gap: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem' }}>⚡</div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', color: 'var(--text)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text2)', maxWidth: 420 }}>
            An unexpected error occurred. Your data is safe in localStorage.
            Try refreshing the page.
          </p>
          {this.state.error && (
            <pre
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.78rem',
                color: 'var(--red)',
                maxWidth: 480,
                overflow: 'auto',
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            ↺ Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
