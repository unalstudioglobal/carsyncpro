import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('🔴 ErrorBoundary yakaladı:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Sayfayı da yenile (state bozulmuş olabilir)
    window.location.hash = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    // ── Default hata ekranı ──────────────────────────────
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'var(--bg-void)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'var(--font-body)',
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'rgba(255,59,59,0.1)',
          border: '1px solid rgba(255,59,59,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF3B3B" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 26,
          letterSpacing: 1, color: 'var(--text-primary)',
          marginBottom: 8,
        }}>
          BİR HATA OLUŞTU
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, textAlign: 'center' }}>
          Beklenmedik bir sorun ile karşılaşıldı.
        </p>

        {this.state.error && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '10px 14px',
            marginBottom: 28, maxWidth: 320,
          }}>
            <code style={{
              color: '#FF3B3B', fontSize: 11,
              fontFamily: 'var(--font-mono)',
              wordBreak: 'break-all',
            }}>
              {this.state.error.message}
            </code>
          </div>
        )}

        <button
          onClick={this.handleReset}
          style={{
            background: 'linear-gradient(135deg, #E8C96B, #C9A84C)',
            color: '#050508', fontWeight: 700, fontSize: 14,
            border: 'none', borderRadius: 14, padding: '13px 28px',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
          }}
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }
}
