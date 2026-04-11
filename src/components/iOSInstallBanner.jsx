import { useState, useEffect } from 'react'
import { X, DownloadSimple } from '@phosphor-icons/react'

/**
 * iOSInstallBanner - A custom banner to encourage iOS users to install the PWA
 * Shows only on iOS devices when not already installed as a PWA
 */
export default function iOSInstallBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if user is on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

    // Check if already installed as PWA
    const isStandalone = window.navigator.standalone || (window.matchMedia('(display-mode: standalone)').matches)

    // Check if user has dismissed the banner
    const hasDismissed = localStorage.getItem('ios-install-banner-dismissed')

    // Show banner only on iOS, not standalone, and not dismissed
    if (isIOS && !isStandalone && !hasDismissed) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem('ios-install-banner-dismissed', 'true')
  }

  const handleInstall = () => {
    // Navigate to install page
    window.location.href = '/install.html'
  }

  if (!isVisible || isDismissed) {
    return null
  }

  return (
    <div className="ios-install-banner">
      <div className="ios-install-banner-content">
        <div className="ios-install-banner-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bannerGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00D4FF"/>
                <stop offset="50%" stopColor="#1A56FF"/>
                <stop offset="100%" stopColor="#7B2FFF"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="#0A0F1E"/>
            <path d="M16 2 L29 9 L29 23 L16 30 L3 23 L3 9 Z" stroke="url(#bannerGrad)" strokeWidth="0.8" fill="none" opacity="0.3"/>
            <path d="M7 9 L16 24 L25 9" stroke="url(#bannerGrad)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <line x1="11" y1="16.5" x2="21" y2="16.5" stroke="#C9A84C" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="16" cy="16.5" r="1.5" fill="#00D4FF"/>
          </svg>
        </div>
        <div className="ios-install-banner-text">
          <div className="ios-install-banner-title">Install Veltro</div>
          <div className="ios-install-banner-subtitle">Add to home screen for the best experience</div>
        </div>
        <button className="ios-install-banner-btn" onClick={handleInstall}>
          <DownloadSimple size={18} weight="bold" />
          <span>Install</span>
        </button>
        <button className="ios-install-banner-close" onClick={handleDismiss}>
          <X size={18} weight="bold" />
        </button>
      </div>
      <style jsx>{`
        .ios-install-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, rgba(10, 15, 30, 0.98) 0%, rgba(10, 15, 30, 0.95) 100%);
          border-top: 1px solid rgba(26, 86, 255, 0.2);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 9999;
          padding: 12px 16px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .ios-install-banner-content {
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 600px;
          margin: 0 auto;
        }

        .ios-install-banner-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(26, 86, 255, 0.1);
          border-radius: 10px;
          border: 1px solid rgba(26, 86, 255, 0.2);
        }

        .ios-install-banner-text {
          flex: 1;
          min-width: 0;
        }

        .ios-install-banner-title {
          font-size: 14px;
          font-weight: 600;
          color: #e8edf8;
          margin-bottom: 2px;
        }

        .ios-install-banner-subtitle {
          font-size: 12px;
          color: #a8b2cc;
          line-height: 1.4;
        }

        .ios-install-banner-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #1A56FF 0%, #00D4FF 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(26, 86, 255, 0.3);
        }

        .ios-install-banner-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(26, 86, 255, 0.4);
        }

        .ios-install-banner-btn:active {
          transform: scale(0.98);
        }

        .ios-install-banner-close {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #a8b2cc;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ios-install-banner-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e8edf8;
        }

        @media (max-width: 480px) {
          .ios-install-banner-content {
            gap: 10px;
          }

          .ios-install-banner-btn {
            padding: 8px 12px;
            font-size: 12px;
          }

          .ios-install-banner-btn span {
            display: none;
          }

          .ios-install-banner-close {
            width: 28px;
            height: 28px;
          }
        }
      `}</style>
    </div>
  )
}
