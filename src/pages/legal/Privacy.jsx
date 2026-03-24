import React from 'react'
import './legal.css'

export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="legal-badge">
          <span className="legal-badge-dot" />
          Legal Document
        </div>
        <h1>Privacy Policy</h1>
        <p className="legal-hero-sub">Last updated: March 20, 2026 &nbsp;·&nbsp; Effective immediately</p>
      </div>

      <div className="legal-body">

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">01</span>
            <h2>Information We Collect</h2>
          </div>
          <p>We collect information you provide directly to us when you create an account, complete your profile, or interact with the platform. This includes:</p>
          <ul>
            <li>Name, email address, and password</li>
            <li>Identity verification documents (KYC)</li>
            <li>Financial information for trading purposes</li>
            <li>Profile preferences and dashboard settings</li>
            <li>Communications you send to our support team</li>
          </ul>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">02</span>
            <h2>Automatically Collected Data</h2>
          </div>
          <p>When you use Veltro, we automatically collect certain information about your device and usage patterns:</p>
          <ul>
            <li>Log data including IP address, browser type, and pages visited</li>
            <li>Device identifiers and operating system information</li>
            <li>Usage patterns, feature interactions, and session duration</li>
            <li>Crash reports and performance diagnostics</li>
          </ul>
          <div className="legal-highlight">
            <p>We use this data solely to improve platform performance and your user experience. It is never sold to third parties.</p>
          </div>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">03</span>
            <h2>How We Use Your Information</h2>
          </div>
          <p>The information we collect is used to:</p>
          <ul>
            <li>Provide, maintain, and improve the Veltro platform</li>
            <li>Process transactions and send related notifications</li>
            <li>Verify your identity and comply with regulatory requirements</li>
            <li>Send you technical notices, security alerts, and support messages</li>
            <li>Respond to comments, questions, and customer service requests</li>
            <li>Monitor and analyze usage trends to improve platform features</li>
          </ul>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">04</span>
            <h2>Information Sharing</h2>
          </div>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
          <ul>
            <li>With service providers who assist in operating our platform</li>
            <li>To comply with legal obligations or law enforcement requests</li>
            <li>To protect the rights, property, or safety of Veltro and its users</li>
            <li>In connection with a merger, acquisition, or sale of company assets</li>
          </ul>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">05</span>
            <h2>Data Security</h2>
          </div>
          <p>We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.</p>
          <p>All data is encrypted in transit using TLS and at rest using AES-256 encryption. However, no method of transmission over the internet is 100% secure.</p>
          <div className="legal-highlight-warn">
            <p>If you suspect unauthorized access to your account, contact our security team immediately at security@veltro.app.</p>
          </div>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">06</span>
            <h2>Cookies</h2>
          </div>
          <p>Veltro uses cookies and similar tracking technologies to enhance your experience. These include session cookies for authentication, preference cookies for your dashboard settings, and analytics cookies to understand usage patterns.</p>
          <p>You can control cookie settings through your browser preferences. Disabling cookies may affect certain platform features.</p>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">07</span>
            <h2>Your Rights</h2>
          </div>
          <p>You have the right to access, correct, or delete your personal data at any time. You may also request data portability or object to certain processing activities. To exercise these rights, contact us at privacy@veltro.app.</p>
          <p>We will respond to all requests within 30 days in accordance with applicable data protection laws.</p>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">08</span>
            <h2>Data Retention</h2>
          </div>
          <p>We retain your personal information for as long as your account is active or as needed to provide services. Financial and transaction records may be retained for up to 7 years to comply with regulatory requirements.</p>
          <p>Upon account deletion, your personal data will be removed within 30 days, except where retention is required by law.</p>
        </div>

        <div className="legal-contact-card">
          <div>
            <h3>Privacy concerns?</h3>
            <p>Reach our data protection officer directly.</p>
          </div>
          <button className="legal-contact-btn">Contact DPO</button>
        </div>

      </div>
    </div>
  )
}
