import React from 'react'
import './legal.css'

export default function RiskDisclosure() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="legal-badge">
          <span className="legal-badge-dot" style={{ backgroundColor: '#F03D55' }} />
          Risk Document
        </div>
        <h1>Risk Disclosure</h1>
        <p className="legal-hero-sub">Last updated: March 20, 2026 &nbsp;·&nbsp; Read carefully before trading</p>
      </div>

      <div className="legal-body">

        <div className="legal-highlight-warn" style={{ borderRadius: '20px', padding: '24px 28px' }}>
          <p style={{ fontSize: '14px !important', lineHeight: '1.8' }}>
            <strong>Important Warning:</strong> Trading financial instruments carries a high level of risk and may not be suitable for all investors. The high degree of leverage available in trading can work against you as well as for you. Before deciding to trade, carefully consider your investment objectives, experience level, and risk tolerance.
          </p>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number" style={{ background: 'rgba(240,61,85,0.12)', borderColor: 'rgba(240,61,85,0.25)', color: '#F03D55' }}>01</span>
            <h2>General Market Risk</h2>
          </div>
          <p>All investments in financial markets involve risk. The value of your investments can go down as well as up, and you may get back less than you originally invested. Past performance is not a guarantee of future results.</p>
          <p>Market prices can be volatile and can move rapidly in response to news, economic data, geopolitical events, or market sentiment -- sometimes with little or no warning.</p>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number" style={{ background: 'rgba(240,61,85,0.12)', borderColor: 'rgba(240,61,85,0.25)', color: '#F03D55' }}>02</span>
            <h2>Leverage Risk</h2>
          </div>
          <p>Trading on margin or with leverage means a small market movement will have a proportionally larger impact on the funds you have deposited. This can work for you as well as against you.</p>
          <ul>
            <li>Leverage amplifies both profits and losses</li>
            <li>You may lose more than your initial deposit</li>
            <li>Margin calls may require additional funds on short notice</li>
            <li>Positions may be closed without your consent if margin requirements are not met</li>
          </ul>
          <div className="legal-highlight-warn">
            <p>You should never trade with funds you cannot afford to lose entirely.</p>
          </div>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number" style={{ background: 'rgba(240,61,85,0.12)', borderColor: 'rgba(240,61,85,0.25)', color: '#F03D55' }}>03</span>
            <h2>Cryptocurrency Risk</h2>
          </div>
          <p>Cryptocurrencies are highly speculative assets with extreme price volatility. Unlike traditional financial instruments, they are not backed by governments or central banks and operate on decentralized networks.</p>
          <ul>
            <li>Prices can drop by 50% or more within a short time period</li>
            <li>Regulatory changes may impact value and accessibility</li>
            <li>Technical vulnerabilities in blockchain protocols may occur</li>
            <li>Loss of private keys results in permanent, irrecoverable loss of assets</li>
            <li>Exchanges may be subject to hacks or sudden closure</li>
          </ul>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number" style={{ background: 'rgba(240,61,85,0.12)', borderColor: 'rgba(240,61,85,0.25)', color: '#F03D55' }}>04</span>
            <h2>Liquidity Risk</h2>
          </div>
          <p>Certain markets or instruments may have limited liquidity, meaning it may be difficult to execute trades at your desired price. This is especially relevant for smaller-cap assets, exotic pairs, or during periods of high market stress.</p>
          <p>Illiquid markets can result in slippage, wider bid-ask spreads, or the inability to exit a position at a reasonable price.</p>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number" style={{ background: 'rgba(240,61,85,0.12)', borderColor: 'rgba(240,61,85,0.25)', color: '#F03D55' }}>05</span>
            <h2>Technology & Platform Risk</h2>
          </div>
          <p>The use of internet-based trading platforms introduces technology risks including system outages, connectivity failures, software errors, and cybersecurity threats.</p>
          <ul>
            <li>Platform downtime may prevent you from managing open positions</li>
            <li>Data feeds may experience delays or inaccuracies</li>
            <li>Order execution may not always reflect displayed prices</li>
            <li>Unauthorized account access due to compromised credentials</li>
          </ul>
          <div className="legal-highlight-gold">
            <p>Always use strong, unique passwords and enable two-factor authentication to reduce account security risk.</p>
          </div>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number" style={{ background: 'rgba(240,61,85,0.12)', borderColor: 'rgba(240,61,85,0.25)', color: '#F03D55' }}>06</span>
            <h2>Regulatory & Legal Risk</h2>
          </div>
          <p>Financial markets are subject to laws and regulations that can change. Regulatory actions may restrict or prohibit certain trading activities, affect asset availability, or require compliance measures that impact your trading.</p>
          <p>Veltro does not provide legal or tax advice. You are solely responsible for ensuring your trading activities comply with the laws applicable in your jurisdiction.</p>
        </div>

        <div className="legal-section">
          <div className="legal-section-header">
            <span className="legal-section-number" style={{ background: 'rgba(240,61,85,0.12)', borderColor: 'rgba(240,61,85,0.25)', color: '#F03D55' }}>07</span>
            <h2>No Investment Advice</h2>
          </div>
          <p>Nothing on the Veltro platform constitutes investment advice, financial advice, trading advice, or any other form of advice. All content is for informational purposes only.</p>
          <p>You should seek independent financial advice from a licensed professional before making any investment decisions. Veltro accepts no liability for any trading decisions made based on information presented on the platform.</p>
        </div>

        <div className="legal-contact-card">
          <div>
            <h3>Need to speak to someone?</h3>
            <p>Our compliance team can address risk-related questions.</p>
          </div>
          <button className="legal-contact-btn" style={{ backgroundColor: '#F03D55' }}>Contact Compliance</button>
        </div>

      </div>
    </div>
  )
}
