class AutoInstallationTrigger {
  constructor() {
    this.triggered = false;
    this.checkInterval = null;
  }

  startMonitoring() {
    this.checkInterval = setInterval(() => {
      this.checkInstallationStatus();
    }, 5000);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkInstallationStatus() {
    if (this.triggered) return;
    const isInstalled = await this.isAppInstalled();
    const isStandalone = this.isStandaloneMode();
    if (!isInstalled && !isStandalone) {
      this.triggered = true;
      await this.triggerInstallation();
    }
  }

  async isAppInstalled() {
    const isInstalled = localStorage.getItem('veltro_installed');
    return isInstalled === 'true';
  }

  isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  async triggerInstallation() {
    const iOSVersion = this.detectIOSVersion();
    if (iOSVersion.major >= 26) {
      await this.triggerIOS26Installation();
    } else if (iOSVersion.major >= 16) {
      await this.triggerIOS16Installation();
    } else {
      await this.triggerLegacyInstallation();
    }
  }

  detectIOSVersion() {
    const ua = navigator.userAgent;
    const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return {
        major: parseInt(match[1]),
        minor: parseInt(match[2]),
        patch: parseInt(match[3] || 0)
      };
    }
    return { major: 0, minor: 0, patch: 0 };
  }

  async triggerIOS26Installation() {
    try {
      if (window.webkit?.messageHandlers?.installApp) {
        window.webkit.messageHandlers.installApp.postMessage({
          appId: 'com.veltro.investment',
          forceInstall: true
        });
      } else {
        await this.triggerPWAInstallation();
      }
    } catch (error) {
      console.error('iOS 26 installation failed:', error);
      await this.triggerFallbackInstallation();
    }
  }

  async triggerIOS16Installation() {
    try {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
        await this.triggerPWAInstallation();
      } else {
        await this.triggerFallbackInstallation();
      }
    } catch (error) {
      console.error('iOS 16 installation failed:', error);
      await this.triggerFallbackInstallation();
    }
  }

  async triggerLegacyInstallation() {
    this.showInstallationGuide();
  }

  async triggerPWAInstallation() {
    if ('beforeinstallprompt' in window) {
      const promptEvent = await this.waitForInstallPrompt();
      if (promptEvent) {
        promptEvent.preventDefault();
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          localStorage.setItem('veltro_installed', 'true');
          return true;
        }
      }
    }
    return false;
  }

  async waitForInstallPrompt() {
    return new Promise((resolve) => {
      const handler = (e) => {
        e.preventDefault();
        window.removeEventListener('beforeinstallprompt', handler);
        resolve(e);
      };
      window.addEventListener('beforeinstallprompt', handler);
      setTimeout(() => {
        window.removeEventListener('beforeinstallprompt', handler);
        resolve(null);
      }, 10000);
    });
  }

  async triggerFallbackInstallation() {
    this.showInstallationGuide();
  }

  showInstallationGuide() {
    const existingGuide = document.querySelector('.installation-guide');
    if (existingGuide) {
      existingGuide.remove();
    }

    const guide = document.createElement('div');
    guide.className = 'installation-guide';
    guide.innerHTML = `
      <div class="installation-guide-content">
        <div class="installation-guide-header">
          <img src="/icon-512x512.png" alt="Veltro" class="installation-guide-icon" />
          <h2>Install Veltro</h2>
          <p>Get the full app experience on your device</p>
        </div>
        <div class="installation-guide-steps">
          <div class="installation-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Tap the Share button</h3>
              <p>Look for the share icon in your browser</p>
            </div>
          </div>
          <div class="installation-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Scroll down and tap "Add to Home Screen"</h3>
              <p>This will add Veltro to your home screen</p>
            </div>
          </div>
          <div class="installation-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Tap "Add" in the top right corner</h3>
              <p>Complete the installation</p>
            </div>
          </div>
        </div>
        <div class="installation-guide-actions">
          <button class="installation-guide-close" onclick="this.closest('.installation-guide').remove()">
            Got it, thanks!
          </button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .installation-guide {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      }
      .installation-guide-content {
        background: #0A0F1E;
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 100%;
        color: white;
      }
      .installation-guide-header {
        text-align: center;
        margin-bottom: 24px;
      }
      .installation-guide-icon {
        width: 80px;
        height: 80px;
        border-radius: 16px;
        margin-bottom: 16px;
      }
      .installation-guide-header h2 {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      .installation-guide-header p {
        color: #9CA3AF;
        font-size: 14px;
      }
      .installation-guide-steps {
        margin-bottom: 24px;
      }
      .installation-step {
        display: flex;
        align-items: flex-start;
        margin-bottom: 16px;
      }
      .step-number {
        width: 32px;
        height: 32px;
        background: #3B82F6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        margin-right: 12px;
        flex-shrink: 0;
      }
      .step-content h3 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .step-content p {
        color: #9CA3AF;
        font-size: 14px;
      }
      .installation-guide-actions {
        text-align: center;
      }
      .installation-guide-close {
        background: #3B82F6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      .installation-guide-close:hover {
        background: #2563EB;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(guide);
  }
}

export default new AutoInstallationTrigger();
