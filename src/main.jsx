import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Setup bug detector in production
if (import.meta.env.PROD) {
  import('./test/bug-detector.js').then(({ bugDetector }) => {
    bugDetector.setupErrorMonitoring();
    
    // Report bugs to console in production
    bugDetector.onBugDetected((bug) => {
      console.error('🐛 Bug detected:', bug);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
