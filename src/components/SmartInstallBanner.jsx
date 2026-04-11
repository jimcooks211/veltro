import React, { useState, useEffect } from 'react';
import iOSInstallationOrchestrator from '../utils/iOSInstallationOrchestrator';
import AutoInstallationTrigger from '../utils/AutoInstallationTrigger';

const SmartInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Start monitoring for installation
    const trigger = new AutoInstallationTrigger();
    trigger.startMonitoring();

    // Check if should show banner
    checkShouldShowBanner();

    // Cleanup
    return () => {
      trigger.stopMonitoring();
    };
  }, []);

  const checkShouldShowBanner = async () => {
    const isInstalled = localStorage.getItem('veltro_installed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const bannerDismissed = localStorage.getItem('veltro_banner_dismissed');

    if (!isInstalled && !isStandalone && !bannerDismissed) {
      // Only show on iOS devices
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        setShowBanner(true);
      }
    }
  };

  const handleInstall = async () => {
    setInstalling(true);
    setMessage('Starting installation...');
    setProgress(10);

    try {
      const orchestrator = new iOSInstallationOrchestrator();
      setProgress(30);
      setMessage('Detecting device...');

      const result = await orchestrator.startInstallation();
      setProgress(70);
      setMessage('Installing...');

      if (result.success) {
        setProgress(100);
        setMessage('Installation complete!');
        localStorage.setItem('veltro_installed', 'true');

        setTimeout(() => {
          setShowBanner(false);
        }, 2000);
      } else {
        setMessage('Installation failed. Please try again.');
      }
    } catch (error) {
      console.error('Installation error:', error);
      setMessage('Installation failed. Please try again.');
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('veltro_banner_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="smart-install-banner">
      <div className="banner-content">
        <div className="banner-icon">
          <img src="/icon-512x512.png" alt="Veltro" />
        </div>
        <div className="banner-text">
          <h3>Install Veltro</h3>
          <p>Get the full app experience on your device</p>
        </div>
        <div className="banner-actions">
          {!installing ? (
            <>
              <button
                className="install-button"
                onClick={handleInstall}
              >
                Install Now
              </button>
              <button
                className="dismiss-button"
                onClick={handleDismiss}
              >
                Later
              </button>
            </>
          ) : (
            <div className="installation-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="progress-message">{message}</p>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .smart-install-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #0A0F1E 0%, #1a1f2e 100%);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px;
          z-index: 1000;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        }

        .banner-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .banner-icon img {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .banner-text {
          flex: 1;
        }

        .banner-text h3 {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin: 0 0 4px 0;
        }

        .banner-text p {
          font-size: 14px;
          color: #9CA3AF;
          margin: 0;
        }

        .banner-actions {
          display: flex;
          gap: 8px;
        }

        .install-button,
        .dismiss-button {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .install-button {
          background: #3B82F6;
          color: white;
        }

        .install-button:hover {
          background: #2563EB;
          transform: translateY(-1px);
        }

        .dismiss-button {
          background: transparent;
          color: #9CA3AF;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .dismiss-button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .installation-progress {
          min-width: 200px;
        }

        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%);
          transition: width 0.3s ease;
        }

        .progress-message {
          font-size: 12px;
          color: #9CA3AF;
          margin: 0;
        }

        @media (max-width: 640px) {
          .banner-content {
            flex-direction: column;
            text-align: center;
          }

          .banner-actions {
            width: 100%;
            justify-content: center;
          }

          .install-button,
          .dismiss-button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SmartInstallBanner;
