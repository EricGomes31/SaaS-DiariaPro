import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/UI/Toast.jsx'

// Só ativa captura de erros se um DSN estiver configurado (.env local / build) —
// sem isso o SDK fica inerte, então dev sem a variável configurada não quebra.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: __APP_VERSION__,
  })
}

function ErrorFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
        background: 'var(--app-bg, #07070f)',
        color: 'var(--card-heading, #f1f5f9)',
        fontFamily: 'Inter, sans-serif',
      }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, margin: 0 }}>Algo deu errado</h1>
      <p style={{ margin: 0, opacity: 0.7, maxWidth: 360 }}>O erro já foi registrado. Tente recarregar a página — se persistir, entre em contato com o suporte.</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          padding: '10px 20px',
          borderRadius: 10,
          border: 'none',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          fontWeight: 600,
          cursor: 'pointer',
        }}>
        Recarregar
      </button>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
