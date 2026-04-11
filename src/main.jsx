import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SwitchMode from './hooks/Switchmode.jsx'

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service worker registered:', registration.scope)
      })
      .catch((error) => {
        console.error('[SW] Service worker registration failed:', error)
      })
  })
}

// iOS 17+ specific optimizations
if (window.navigator.standalone) {
  document.documentElement.classList.add('standalone')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <SwitchMode />
  </StrictMode>
)
