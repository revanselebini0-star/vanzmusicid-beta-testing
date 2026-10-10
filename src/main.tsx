import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent opaque cross-origin script error from bubbling in iframe environments
if (typeof window !== 'undefined') {
  const origOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (message === 'Script error.' || message === 'Script error') {
      return true;
    }
    if (origOnError) {
      return origOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setInterval(() => {
            if (reg.active) {
              reg.active.postMessage({ type: 'KEEP_ALIVE_PING' });
            }
          }, 20000);
        })
        .catch(() => {});
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
