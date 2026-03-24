import React from 'react'
import './legal.css'

export default function Terms() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="legal-badge">
          <span className="legal-badge-dot" />
          Legal Document
        </div>
        <h1>Terms of Service</h1>
        <p className="legal-hero-sub">Last updated: March 20, 2026 &nbsp;·&nbsp; Effective immediately</p>
      </div>

      <div className="legal-body">

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">01</span>
            <h2>Acceptance of Terms</h2>
          </div>
          <p>By accessing or using Veltro, you agree to be bound by these Terms of Service. If you do not agree to all terms, you may not access or use the platform.</p>
          <p>These terms apply to all visitors, users, and others who access or use the service. We reserve the right to update these terms at any time.</p>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">02</span>
            <h2>Use of the Platform</h2>
          </div>
          <p>You agree to use Veltro only for lawful purposes and in accordance with these terms. You must not:</p>
          <ul>
            <li>Use the platform in any way that violates applicable laws or regulations</li>
            <li>Transmit any unsolicited or unauthorized advertising or promotional material</li>
            <li>Attempt to gain unauthorized access to any part of the service</li>
            <li>Engage in any conduct that restricts or inhibits anyone's use of the platform</li>
            <li>Use automated scripts to collect information or interact with the service</li>
          </ul>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">03</span>
            <h2>Account Registration</h2>
          </div>
          <p>To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          <p>You must provide accurate, current, and complete information during registration and keep it updated. Veltro reserves the right to suspend or terminate accounts that violate these terms.</p>
          <div className="legal-highlight">
            <p>You must be at least 18 years of age to create an account and use the trading features of Veltro.</p>
          </div>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">04</span>
            <h2>Financial Services Disclaimer</h2>
          </div>
          <p>Veltro is a trading dashboard platform. The information provided on this platform is for informational purposes only and does not constitute financial, investment, or trading advice.</p>
          <p>All trading decisions are made solely by you. Veltro is not responsible for any financial losses incurred through the use of the platform or reliance on information presented.</p>
          <div className="legal-highlight-warn">
            <p>Trading financial instruments involves significant risk of loss. Past performance is not indicative of future results. Never trade with money you cannot afford to lose.</p>
          </div>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">05</span>
            <h2>Intellectual Property</h2>
          </div>
          <p>The platform and its original content, features, and functionality are and will remain the exclusive property of Veltro and its licensors. Our trademarks may not be used without prior written consent.</p>
          <p>You may not copy, modify, distribute, sell, or lease any part of our service or included software without explicit written permission.</p>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">06</span>
            <h2>Termination</h2>
          </div>
          <p>We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including breach of these terms.</p>
          <p>Upon termination, your right to use the service will immediately cease. All provisions which by their nature should survive termination shall survive.</p>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">07</span>
            <h2>Limitation of Liability</h2>
          </div>
          <p>To the maximum extent permitted by law, Veltro shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
          <p>Our total liability to you for any claims arising from use of the platform shall not exceed the amount you have paid to Veltro in the past twelve months.</p>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number">08</span>
            <h2>Governing Law</h2>
          </div>
          <p>These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions. Any disputes shall be resolved through binding arbitration.</p>
        </div>

        <div className="legal-contact-card">
          <div>
            <h3>Questions about our Terms?</h3>
            <p>Our legal team is available to clarify any part of this document.</p>
          </div>
          <button className="legal-contact-btn">Contact Legal</button>
        </div>

      </div>
    </div>
  )
}
