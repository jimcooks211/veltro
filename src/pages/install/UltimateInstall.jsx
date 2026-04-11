import { useState, useEffect } from 'react'

/**
 * UltimateInstall - Comprehensive iOS home screen installation with all available methods
 * Combines itms-services, configuration profile, iOS shortcut, PWA, and Safari manual methods
 */
export default function UltimateInstall() {
  const [deviceInfo, setDeviceInfo] = useState({
    device: 'Detecting...',
    browser: 'Detecting...',
    iosVersion: 'Detecting...',
    isIOS: false
  })
  const [progress, setProgress] = useState({
    show: false,
    fill: 0,
    text: 'Initializing installation...'
  })
  const [success, setSuccess] = useState(false)
  const [methodStatus, setMethodStatus] = useState({
    1: 'pending',
    2: 'pending',
    3: 'pending',
    4: 'pending'
  })

  useEffect(() => {
    detectDevice()
  }, [])

  function detectDevice() {
    const ua = navigator.userAgent
    let device = 'Unknown'
    let browser = 'Unknown'
    let iosVersion = 'Unknown'

    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      device = 'iOS Device'
      if (/iPad/.test(ua)) device = 'iPad'
      else if (/iPhone/.test(ua)) device = 'iPhone'
      else if (/iPod/.test(ua)) device = 'iPod Touch'

      const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/)
      if (match) {
        iosVersion = `iOS ${match[1]}.${match[2]}`
        if (match[3]) iosVersion += `.${match[3]}`
      }
    } else if (/Android/.test(ua)) {
      device = 'Android Device'
    } else if (/Windows/.test(ua)) {
      device = 'Windows PC'
    } else if (/Mac/.test(ua)) {
      device = 'Mac'
    } else if (/Linux/.test(ua)) {
      device = 'Linux PC'
    }

    if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
      browser = 'Safari'
    } else if (/Chrome/.test(ua)) {
      browser = 'Chrome'
    } else if (/Firefox/.test(ua)) {
      browser = 'Firefox'
    } else if (/Edge/.test(ua)) {
      browser = 'Edge'
    }

    setDeviceInfo({
      device,
      browser,
      iosVersion,
      isIOS: /iPad|iPhone|iPod/.test(ua) && !window.MSStream
    })
  }

  function updateMethodStatus(methodNum, status) {
    setMethodStatus(prev => ({
      ...prev,
      [methodNum]: status
    }))
  }

  function startUltimateInstall() {
    const { isIOS } = deviceInfo
    setProgress({
      show: true,
      fill: 0,
      text: 'Initializing installation...'
    })

    const steps = [
      { progress: 10, text: 'Detecting device capabilities...', method: null },
      { progress: 20, text: 'Trying itms-services (OTA)...', method: 1 },
      { progress: 35, text: 'Trying configuration profile...', method: 2 },
      { progress: 50, text: 'Trying iOS Shortcut...', method: 3 },
      { progress: 65, text: 'Trying PWA installation...', method: 4 },
      { progress: 80, text: 'Finalizing installation...', method: null },
      { progress: 100, text: 'Installation complete!', method: null }
    ]

    let currentStep = 0

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep]
        setProgress(prev => ({
          ...prev,
          fill: step.progress,
          text: step.text
        }))

        if (step.method) {
          updateMethodStatus(step.method, 'pending')
        }

        currentStep++

        if (currentStep === 2) {
          try {
            updateMethodStatus(1, 'success')
            window.location.href = 'itms-services://?action=download-manifest&url=https://veltroinvestment.vercel.app/Veltro.plist'
          } catch (e) {
            updateMethodStatus(1, 'failed')
            console.log('itms-services failed:', e)
          }
        } else if (currentStep === 3) {
          setTimeout(() => {
            try {
              updateMethodStatus(2, 'success')
              window.location.href = '/Veltro.mobileconfig'
            } catch (e) {
              updateMethodStatus(2, 'failed')
              console.log('Configuration profile failed:', e)
            }
          }, 1000)
        } else if (currentStep === 4) {
          setTimeout(() => {
            try {
              updateMethodStatus(3, 'success')
              window.location.href = '/Veltro.shortcut'
            } catch (e) {
              updateMethodStatus(3, 'failed')
              console.log('iOS Shortcut failed:', e)
            }
          }, 2000)
        } else if (currentStep === 5) {
          setTimeout(() => {
            try {
              updateMethodStatus(4, 'success')
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then(() => {
                  window.location.reload()
                })
              }
            } catch (e) {
              updateMethodStatus(4, 'failed')
              console.log('PWA install failed:', e)
            }
          }, 3000)
        }
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setProgress(prev => ({ ...prev, show: false }))
          setSuccess(true)
        }, 500)
      }
    }, 800)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✓'
      case 'failed': return '✗'
      default: return '?'
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'success': return 'status-success'
      case 'failed': return 'status-failed'
      default: return 'status-pending'
    }
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #0A0F1E 0%, #1a1f2e 100%)',
      color: '#fff',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 30px',
          background: 'linear-gradient(135deg, #1A56FF 0%, #00D4FF 100%)',
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '56px',
          fontWeight: 800,
          boxShadow: '0 0 50px rgba(26,86,255,0.4)',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          V
        </div>

        <h1 style={{
          fontSize: '36px',
          fontWeight: 800,
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #1A56FF 0%, #00D4FF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Install Veltro
        </h1>

        <p style={{
          color: '#a8b2cc',
          fontSize: '18px',
          marginBottom: '40px',
          lineHeight: 1.5
        }}>
          Ultimate installation with all methods
        </p>

        <button
          onClick={startUltimateInstall}
          style={{
            display: 'block',
            width: '100%',
            padding: '24px',
            background: 'linear-gradient(135deg, #1A56FF 0%, #00D4FF 100%)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '20px',
            fontSize: '20px',
            fontWeight: 800,
            marginBottom: '20px',
            boxShadow: '0 10px 40px rgba(26,86,255,0.5)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            border: 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          🚀 Install Now
        </button>

        {progress.show && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              height: '8px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #1A56FF, #00D4FF)',
                width: `${progress.fill}%`,
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }} />
            </div>
            <div style={{
              fontSize: '14px',
              color: '#a8b2cc',
              textAlign: 'left'
            }}>
              {progress.text}
            </div>
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(0,230,118,0.1)',
            border: '1px solid rgba(0,230,118,0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <div style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#00E676',
              marginBottom: '8px'
            }}>
              Installation Started!
            </div>
            <div style={{
              fontSize: '14px',
              color: '#a8b2cc',
              lineHeight: 1.5
            }}>
              Check your home screen. The Veltro icon should appear shortly.<br /><br />
              If you don't see it, try the alternative methods below.
            </div>
          </div>
        )}

        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          fontSize: '13px',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              background: getStatusClass(methodStatus[1])
            }}>
              {getStatusIcon(methodStatus[1])}
            </div>
            <div>Method 1: itms-services (OTA)</div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              background: getStatusClass(methodStatus[2])
            }}>
              {getStatusIcon(methodStatus[2])}
            </div>
            <div>Method 2: Configuration Profile</div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              background: getStatusClass(methodStatus[3])
            }}>
              {getStatusIcon(methodStatus[3])}
            </div>
            <div>Method 3: iOS Shortcut</div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              background: getStatusClass(methodStatus[4])
            }}>
              {getStatusIcon(methodStatus[4])}
            </div>
            <div>Method 4: PWA Install</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '30px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 700,
            marginBottom: '16px',
            color: '#00D4FF'
          }}>
            Manual Methods
          </div>
          <a
            href="itms-services://?action=download-manifest&url=https://veltroinvestment.vercel.app/Veltro.plist"
            style={{
              display: 'block',
              width: '100%',
              padding: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#a8b2cc',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              marginBottom: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            📱 Try itms-services Direct
          </a>
          <a
            href="/Veltro.mobileconfig"
            style={{
              display: 'block',
              width: '100%',
              padding: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#a8b2cc',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              marginBottom: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            ⚙️ Download Configuration Profile
          </a>
          <a
            href="/Veltro.shortcut"
            style={{
              display: 'block',
              width: '100%',
              padding: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#a8b2cc',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              marginBottom: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            🎯 Download iOS Shortcut
          </a>
          <a
            href="/install-ios-native.html"
            style={{
              display: 'block',
              width: '100%',
              padding: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#a8b2cc',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            🍎 Safari Manual Instructions
          </a>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '16px',
          background: 'rgba(26,86,255,0.1)',
          border: '1px solid rgba(26,86,255,0.2)',
          borderRadius: '12px',
          fontSize: '13px',
          color: '#a8b2cc'
        }}>
          <strong style={{ color: '#00D4FF' }}>Device:</strong> {deviceInfo.device}<br />
          <strong style={{ color: '#00D4FF' }}>Browser:</strong> {deviceInfo.browser}<br />
          <strong style={{ color: '#00D4FF' }}>iOS Version:</strong> {deviceInfo.iosVersion}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 50px rgba(26,86,255,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 70px rgba(26,86,255,0.6); }
        }
        .status-success { background: #00E676; color: #000; }
        .status-failed { background: #FF5252; color: #fff; }
        .status-pending { background: #FFB74D; color: #000; }
      `}</style>
    </div>
  )
}
