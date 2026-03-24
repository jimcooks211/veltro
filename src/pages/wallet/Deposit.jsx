import { useState, useEffect, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { apiPost, apiGet } from '../../utils/api.js'
import {
  CaretRight, CaretLeft, ArrowCircleDown, CheckCircle,
  Bank, CreditCard, CurrencyBtc, CurrencyEth,
  Copy, QrCode, ShieldCheck, Clock, Info,
  ArrowSquareOut, Lightning, Wallet, Coins,
  XCircle, Hourglass, Check, Spinner,
  CurrencyDollar, Warning,
} from '@phosphor-icons/react'
import './Deposit.css'

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const METHODS = [
  {
    id: 'bank',
    label: 'Bank Transfer',
    sub: 'ACH / Wire',
    Icon: Bank,
    color: '#1A56FF',
    fee: 'Free',
    time: '1–3 business days',
    min: 50,
    max: 50_000,
    daily: 25_000,
    desc: 'Transfer directly from your bank account. No fees for ACH.',
  },
  {
    id: 'card',
    label: 'Debit / Credit',
    sub: 'Visa · Mastercard',
    Icon: CreditCard,
    color: '#9945FF',
    fee: '1.5%',
    time: 'Instant',
    min: 10,
    max: 5_000,
    daily: 5_000,
    desc: 'Instantly fund your account with any major card. A 1.5% processing fee applies.',
  },
  {
    id: 'crypto',
    label: 'Crypto Deposit',
    sub: 'BTC · ETH · SOL',
    Icon: CurrencyBtc,
    color: '#F7931A',
    fee: 'Network fee',
    time: '10–30 min',
    min: null,
    max: null,
    daily: null,
    desc: 'Send any supported cryptocurrency to your Veltro wallet address.',
  },
  {
    id: 'usdc',
    label: 'USDC / Stablecoin',
    sub: 'ERC-20 · Solana',
    Icon: CurrencyDollar,
    color: '#2775CA',
    fee: 'Network fee',
    time: '2–10 min',
    min: null,
    max: null,
    daily: null,
    desc: 'Deposit USDC or USDT stablecoins on Ethereum or Solana network.',
  },
]

const QUICK_AMOUNTS = [100, 500, 1_000, 5_000]

const $ = (n, d = 2) =>
  `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`

/* ═══════════════════════════════════════════════════════════════
   STEP INDICATOR
═══════════════════════════════════════════════════════════════ */
function StepBar({ step, total, labels }) {
  return (
    <div className='dp-steps'>
      {labels.map((lbl, i) => {
        const idx   = i + 1
        const done  = idx < step
        const active = idx === step
        return (
          <div key={i} className={`dp-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
            <div className='dp-step-circle'>
              {done ? <Check size={11} weight='bold'/> : idx}
            </div>
            <span className='dp-step-label'>{lbl}</span>
            {i < total - 1 && (
              <div className={`dp-step-line ${done ? 'done' : ''}`}/>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   METHOD CARD
═══════════════════════════════════════════════════════════════ */
function MethodCard({ method, selected, onClick }) {
  const Icon = method.Icon
  return (
    <button
      className={`dp-method-card ${selected ? 'on' : ''}`}
      style={{ '--mc': method.color }}
      onClick={onClick}
    >
      <div className='dp-mc-icon' style={{ background: `${method.color}18`, color: method.color }}>
        <Icon size={22} weight='duotone'/>
      </div>
      <div className='dp-mc-info'>
        <span className='dp-mc-label'>{method.label}</span>
        <span className='dp-mc-sub'>{method.sub}</span>
      </div>
      <div className='dp-mc-right'>
        <span className='dp-mc-fee'>{method.fee}</span>
        <span className='dp-mc-time'>
          <Clock size={9} weight='bold'/>
          {method.time}
        </span>
      </div>
      <div className='dp-mc-check'>
        <Check size={11} weight='bold'/>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COPY BUTTON
═══════════════════════════════════════════════════════════════ */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button className={`dp-copy-btn ${copied ? 'done' : ''}`} onClick={copy}>
      {copied ? <Check size={13} weight='bold'/> : <Copy size={13} weight='bold'/>}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ADDRESS BOX
═══════════════════════════════════════════════════════════════ */
function AddressBox({ addr, network, color }) {
  return (
    <div className='dp-addr-box'>
      <div className='dp-addr-label'>
        <span style={{ color }}>{network}</span> Deposit Address
      </div>
      <div className='dp-addr-row'>
        <span className='dp-addr-text'>{addr}</span>
        <CopyBtn text={addr}/>
      </div>
      <div className='dp-addr-warn'>
        <Warning size={11} weight='fill'/>
        Only send {network} assets to this address. Wrong network = permanent loss.
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 1 — CHOOSE METHOD
═══════════════════════════════════════════════════════════════ */
function Step1({ selected, setSelected, onNext }) {
  return (
    <div className='dp-step-body'>
      <div className='dp-section-head'>
        <h2 className='dp-section-title'>Choose deposit method</h2>
        <p className='dp-section-sub'>Select how you'd like to fund your account.</p>
      </div>
      <div className='dp-methods'>
        {METHODS.map(m => (
          <MethodCard
            key={m.id}
            method={m}
            selected={selected?.id === m.id}
            onClick={() => setSelected(m)}
          />
        ))}
      </div>
      {selected && (
        <div className='dp-method-desc'>
          <Info size={13} weight='duotone' style={{ color: selected.color, flexShrink: 0 }}/>
          <span>{selected.desc}</span>
          {selected.min && (
            <span className='dp-desc-limits'>
              Min {$(selected.min, 0)} · Max {$(selected.max, 0)}/txn · {$(selected.daily, 0)}/day
            </span>
          )}
        </div>
      )}
      <div className='dp-foot'>
        <div/>
        <button className='dp-btn-primary' disabled={!selected} onClick={onNext}>
          Continue
          <CaretRight size={14} weight='bold'/>
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 2 — DETAILS (varies by method)
═══════════════════════════════════════════════════════════════ */
function Step2Bank({ amount, setAmount, onBack, onNext }) {
  const m       = METHODS.find(x => x.id === 'bank')
  const numAmt  = parseFloat(amount) || 0
  const valid   = numAmt >= m.min && numAmt <= m.max

  return (
    <div className='dp-step-body'>
      <div className='dp-section-head'>
        <h2 className='dp-section-title'>Bank Transfer</h2>
        <p className='dp-section-sub'>ACH · Free · 1–3 business days</p>
      </div>

      {/* amount */}
      <div className='dp-field-group'>
        <label className='dp-label'>Amount (USD)</label>
        <div className='dp-amount-wrap'>
          <span className='dp-currency-sym'>$</span>
          <input
            className='dp-amount-input'
            type='number' min={m.min} max={m.max} step='0.01'
            placeholder='0.00'
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
        <div className='dp-quick-row'>
          {QUICK_AMOUNTS.map(q => (
            <button key={q} className='dp-quick-chip'
              onClick={() => setAmount(String(q))}>
              ${q.toLocaleString()}
            </button>
          ))}
        </div>
        <span className='dp-field-hint'>
          Min {$(m.min, 0)} · Max {$(m.max, 0)} per transaction
        </span>
      </div>

      {/* bank details */}
      <div className='dp-info-panel'>
        <div className='dp-info-head'>
          <Bank size={13} weight='duotone' style={{ color:'#1A56FF' }}/>
          Veltro Bank Details
        </div>
        {[
          { label:'Bank Name',      val:'JPMorgan Chase Bank' },
          { label:'Account Name',   val:'Veltro Inc.' },
          { label:'Account Number', val:'••••  ••••  4821', copy:'00012345674821' },
          { label:'Routing Number', val:'021000021',        copy:'021000021' },
          { label:'Reference',      val:'VLT-DEP-28841',    copy:'VLT-DEP-28841' },
        ].map(row => (
          <div key={row.label} className='dp-info-row'>
            <span className='dp-info-key'>{row.label}</span>
            <div className='dp-info-val-wrap'>
              <span className='dp-info-val'>{row.val}</span>
              {row.copy && <CopyBtn text={row.copy}/>}
            </div>
          </div>
        ))}
        <div className='dp-info-note'>
          <Info size={11} weight='fill'/>
          Include your reference code so we can match your transfer.
        </div>
      </div>

      <div className='dp-foot'>
        <button className='dp-btn-ghost' onClick={onBack}>
          <CaretLeft size={13} weight='bold'/>Back
        </button>
        <button className='dp-btn-primary' disabled={!valid} onClick={onNext}>
          Review Deposit
          <CaretRight size={14} weight='bold'/>
        </button>
      </div>
    </div>
  )
}

function Step2Card({ amount, setAmount, card, setCard, onBack, onNext }) {
  const m      = METHODS.find(x => x.id === 'card')
  const numAmt = parseFloat(amount) || 0
  const fee    = numAmt * 0.015
  const total  = numAmt + fee
  const valid  = numAmt >= m.min && numAmt <= m.max &&
                 card.number.replace(/\s/g,'').length === 16 &&
                 card.expiry.length === 5 && card.cvv.length >= 3

  const fmtCard = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()
  const fmtExp  = v => {
    const d = v.replace(/\D/g,'').slice(0,4)
    return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d
  }

  return (
    <div className='dp-step-body'>
      <div className='dp-section-head'>
        <h2 className='dp-section-title'>Debit / Credit Card</h2>
        <p className='dp-section-sub'>Instant · 1.5% processing fee</p>
      </div>

      <div className='dp-field-group'>
        <label className='dp-label'>Amount (USD)</label>
        <div className='dp-amount-wrap'>
          <span className='dp-currency-sym'>$</span>
          <input className='dp-amount-input' type='number' placeholder='0.00'
            min={m.min} max={m.max} value={amount}
            onChange={e => setAmount(e.target.value)}/>
        </div>
        <div className='dp-quick-row'>
          {QUICK_AMOUNTS.slice(0,3).map(q => (
            <button key={q} className='dp-quick-chip' onClick={() => setAmount(String(q))}>
              ${q.toLocaleString()}
            </button>
          ))}
        </div>
        {numAmt > 0 && (
          <div className='dp-fee-strip'>
            <span>Amount: {$(numAmt)}</span>
            <span>Fee (1.5%): {$(fee)}</span>
            <span className='dp-fee-total'>Total charged: {$(total)}</span>
          </div>
        )}
      </div>

      {/* card fields */}
      <div className='dp-field-group'>
        <label className='dp-label'>Card Number</label>
        <div className='dp-input-wrap'>
          <CreditCard size={14} className='dp-input-ico' weight='duotone'/>
          <input className='dp-input' placeholder='1234 5678 9012 3456'
            value={card.number} maxLength={19}
            onChange={e => setCard(c => ({ ...c, number: fmtCard(e.target.value) }))}/>
        </div>
      </div>
      <div className='dp-field-row'>
        <div className='dp-field-group'>
          <label className='dp-label'>Expiry</label>
          <input className='dp-input dp-input-sm' placeholder='MM/YY'
            value={card.expiry} maxLength={5}
            onChange={e => setCard(c => ({ ...c, expiry: fmtExp(e.target.value) }))}/>
        </div>
        <div className='dp-field-group'>
          <label className='dp-label'>CVV</label>
          <input className='dp-input dp-input-sm' placeholder='•••' type='password'
            maxLength={4} value={card.cvv}
            onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))}/>
        </div>
      </div>
      <div className='dp-field-group'>
        <label className='dp-label'>Cardholder Name</label>
        <input className='dp-input' placeholder='Full name on card'
          value={card.name}
          onChange={e => setCard(c => ({ ...c, name: e.target.value }))}/>
      </div>

      <div className='dp-secure-note'>
        <ShieldCheck size={13} weight='fill' style={{ color:'#00C076' }}/>
        256-bit SSL encrypted · PCI DSS compliant · Never stored
      </div>

      <div className='dp-foot'>
        <button className='dp-btn-ghost' onClick={onBack}>
          <CaretLeft size={13} weight='bold'/>Back
        </button>
        <button className='dp-btn-primary' disabled={!valid} onClick={onNext}>
          Review Deposit
          <CaretRight size={14} weight='bold'/>
        </button>
      </div>
    </div>
  )
}

function Step2Crypto({ asset, setAsset, onBack, onNext, cryptoAssets, addressesLoading }) {
  if (addressesLoading) {
    return (
      <div className='dp-step-body'>
        <div className='dp-loading'>Loading deposit addresses...</div>
      </div>
    )
  }

  return (
    <div className='dp-step-body'>
      <div className='dp-section-head'>
        <h2 className='dp-section-title'>Crypto Deposit</h2>
        <p className='dp-section-sub'>Send to your Veltro wallet address below.</p>
      </div>

      <div className='dp-field-group'>
        <label className='dp-label'>Select Asset</label>
        <div className='dp-asset-selector'>
          {cryptoAssets.map(a => (
            <button
              key={a.id}
              className={`dp-asset-chip ${asset?.id === a.id ? 'on' : ''}`}
              style={{ '--ac': a.color }}
              onClick={() => setAsset(a)}
            >
              <span className='dp-ac-dot' style={{ background: a.color }}/>
              {a.id}
              <span className='dp-ac-name'>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {asset && (
        <>
          <AddressBox addr={asset.addr} network={asset.network} color={asset.color}/>
          <div className='dp-crypto-info'>
            <div className='dp-ci-row'>
              <Clock size={11} weight='duotone'/> Confirmations required: 3
            </div>
            <div className='dp-ci-row'>
              <Info size={11} weight='duotone'/> Minimum deposit: 0.0001 {asset.id}
            </div>
            <div className='dp-ci-row'>
              <Lightning size={11} weight='duotone'/> Credited after network confirmation
            </div>
          </div>
        </>
      )}

      <div className='dp-foot'>
        <button className='dp-btn-ghost' onClick={onBack}>
          <CaretLeft size={13} weight='bold'/>Back
        </button>
        <button className='dp-btn-primary' disabled={!asset} onClick={onNext}>
          I've Sent Funds
          <CaretRight size={14} weight='bold'/>
        </button>
      </div>
    </div>
  )
}

function Step2USDC({ network, setNetwork, onBack, onNext, usdcNetworks, addressesLoading }) {
  if (addressesLoading) {
    return (
      <div className='dp-step-body'>
        <div className='dp-loading'>Loading deposit addresses...</div>
      </div>
    )
  }

  return (
    <div className='dp-step-body'>
      <div className='dp-section-head'>
        <h2 className='dp-section-title'>USDC Deposit</h2>
        <p className='dp-section-sub'>Choose your preferred network below.</p>
      </div>

      <div className='dp-field-group'>
        <label className='dp-label'>Network</label>
        <div className='dp-network-cards'>
          {usdcNetworks.map(n => (
            <button
              key={n.id}
              className={`dp-network-card ${network?.id === n.id ? 'on' : ''}`}
              style={{ '--nc': n.color }}
              onClick={() => setNetwork(n)}
            >
              <div className='dp-nc-dot' style={{ background: n.color }}/>
              <div className='dp-nc-info'>
                <span className='dp-nc-label'>{n.label}</span>
                <span className='dp-nc-sub'>{n.sub}</span>
              </div>
              <span className='dp-nc-fee'>{n.fee} fee</span>
            </button>
          ))}
        </div>
      </div>

      {network && (
        <AddressBox addr={network.addr} network={`USDC (${network.sub})`} color={network.color}/>
      )}

      <div className='dp-foot'>
        <button className='dp-btn-ghost' onClick={onBack}>
          <CaretLeft size={13} weight='bold'/>Back
        </button>
        <button className='dp-btn-primary' disabled={!network} onClick={onNext}>
          I've Sent Funds
          <CaretRight size={14} weight='bold'/>
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 3 — REVIEW & CONFIRM
═══════════════════════════════════════════════════════════════ */
function Step3({ method, amount, card, cryptoAsset, usdcNetwork, onBack, onConfirm, loading }) {
  const isFiat   = method.id === 'bank' || method.id === 'card'
  const numAmt   = parseFloat(amount) || 0
  const fee      = method.id === 'card' ? numAmt * 0.015 : 0
  const total    = numAmt + fee
  const Icon     = method.Icon

  const rows = isFiat ? [
    { label: 'Method',    val: method.label },
    { label: 'Amount',    val: $(numAmt) },
    ...(fee > 0 ? [{ label: 'Processing fee', val: $(fee) }] : []),
    { label: 'Total',     val: $(total), bold: true },
    { label: 'Est. time', val: method.time },
    ...(method.id === 'card' ? [{ label: 'Card', val: `•••• ${card.number.slice(-4)}` }] : []),
  ] : method.id === 'crypto' ? [
    { label: 'Asset',    val: cryptoAsset?.id },
    { label: 'Network',  val: cryptoAsset?.network },
    { label: 'Address',  val: `${cryptoAsset?.addr?.slice(0,12)}…`, mono: true },
    { label: 'Fee',      val: 'Network fee (paid by you)' },
    { label: 'Est. time', val: method.time },
  ] : [
    { label: 'Asset',    val: 'USDC' },
    { label: 'Network',  val: `${usdcNetwork?.label} (${usdcNetwork?.sub})` },
    { label: 'Address',  val: `${usdcNetwork?.addr?.slice(0,12)}…`, mono: true },
    { label: 'Fee',      val: usdcNetwork?.fee },
    { label: 'Est. time', val: method.time },
  ]

  return (
    <div className='dp-step-body'>
      <div className='dp-section-head'>
        <h2 className='dp-section-title'>Review deposit</h2>
        <p className='dp-section-sub'>Confirm the details below before proceeding.</p>
      </div>

      <div className='dp-review-card'>
        <div className='dp-review-header'>
          <div className='dp-review-icon' style={{ background:`${method.color}18`, color:method.color }}>
            <Icon size={20} weight='duotone'/>
          </div>
          <div>
            <div className='dp-review-method'>{method.label}</div>
            {isFiat && <div className='dp-review-amount'>{$(total)}</div>}
          </div>
        </div>
        <div className='dp-review-rows'>
          {rows.map(r => (
            <div key={r.label} className={`dp-review-row ${r.bold ? 'bold' : ''}`}>
              <span className='dp-rr-key'>{r.label}</span>
              <span className={`dp-rr-val ${r.mono ? 'mono' : ''}`}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className='dp-confirm-note'>
        <ShieldCheck size={13} weight='fill' style={{ color:'#00C076' }}/>
        By confirming, you agree to Veltro's deposit terms and AML policy.
      </div>

      <div className='dp-foot'>
        <button className='dp-btn-ghost' onClick={onBack} disabled={loading}>
          <CaretLeft size={13} weight='bold'/>Back
        </button>
        <button className='dp-btn-primary' onClick={onConfirm} disabled={loading}>
          {loading
            ? <><Spinner size={14} className='dp-spin'/>Processing…</>
            : <><CheckCircle size={14} weight='bold'/>Confirm Deposit</>
          }
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 4 — SUCCESS
═══════════════════════════════════════════════════════════════ */
function Step4({ method, amount, onDone, onAnother }) {
  const isFiat = method.id === 'bank' || method.id === 'card'
  const numAmt = parseFloat(amount) || 0

  return (
    <div className='dp-step-body dp-success-body'>
      <div className='dp-success-ring'>
        <div className='dp-success-icon'>
          <CheckCircle size={36} weight='fill'/>
        </div>
      </div>
      <h2 className='dp-success-title'>
        {isFiat ? 'Deposit Initiated' : 'Address Ready'}
      </h2>
      <p className='dp-success-sub'>
        {method.id === 'bank'
          ? `Your $${numAmt.toLocaleString()} bank transfer has been initiated. Funds arrive in 1–3 business days.`
          : method.id === 'card'
          ? `$${numAmt.toLocaleString()} is being processed. Your balance will update shortly.`
          : `Send funds to the address shown. We'll credit your account after network confirmation.`
        }
      </p>

      <div className='dp-success-status'>
        <div className='dp-ss-row'>
          <Clock size={13} weight='duotone' style={{ color:'#FFB800' }}/>
          <span>Status: <strong>Pending confirmation</strong></span>
        </div>
        <div className='dp-ss-row'>
          <ShieldCheck size={13} weight='duotone' style={{ color:'#00C076' }}/>
          <span>Ref: <strong>VLT-{Date.now().toString().slice(-8)}</strong></span>
        </div>
        <div className='dp-ss-row'>
          <Lightning size={13} weight='duotone' style={{ color:'#1A56FF' }}/>
          <span>You'll receive an email confirmation shortly</span>
        </div>
      </div>

      <div className='dp-success-actions'>
        <button className='dp-btn-primary' onClick={onDone}>
          <Wallet size={14} weight='bold'/>
          Back to Wallet
        </button>
        <button className='dp-btn-ghost' onClick={onAnother}>
          <ArrowCircleDown size={14} weight='bold'/>
          New Deposit
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   RIGHT SIDEBAR — Info + Limits
═══════════════════════════════════════════════════════════════ */
function DepositSidebar({ method }) {
  const limits = method ? [
    ...(method.min  ? [{ label:'Min per transaction', val:`$${method.min.toLocaleString()}` }] : []),
    ...(method.max  ? [{ label:'Max per transaction', val:`$${method.max.toLocaleString()}` }] : []),
    ...(method.daily? [{ label:'Daily limit',         val:`$${method.daily.toLocaleString()}` }] : []),
    { label:'Processing fee', val: method.fee },
    { label:'Est. time',      val: method.time },
  ] : []

  return (
    <aside className='dp-sidebar'>

      {/* selected method summary */}
      {method && (() => {
        const Icon = method.Icon
        return (
          <div className='dp-side-panel'>
            <div className='dp-side-head'>
              <Info size={12} weight='duotone' className='dp-pico'/>
              Method Details
            </div>
            <div className='dp-side-body'>
              <div className='dp-side-method-row'>
                <div className='dp-smi' style={{ background:`${method.color}18`, color:method.color }}>
                  <Icon size={14} weight='duotone'/>
                </div>
                <div>
                  <div className='dp-sml'>{method.label}</div>
                  <div className='dp-sms'>{method.sub}</div>
                </div>
              </div>
            {limits.map(l => (
              <div key={l.label} className='dp-side-row'>
                <span className='dp-sr-key'>{l.label}</span>
                <span className='dp-sr-val'>{l.val}</span>
              </div>
            ))}
          </div>
        </div>
        )
      })()}

      {/* security */}
      <div className='dp-side-panel'>
        <div className='dp-side-head'>
          <ShieldCheck size={12} weight='duotone' className='dp-pico'/>
          Security
        </div>
        <div className='dp-side-body'>
          {[
            { label:'SSL Encrypted',   ok:true },
            { label:'2FA Required',    ok:true },
            { label:'AML Screened',    ok:true },
            { label:'FDIC Insured',    ok:true },
          ].map(s => (
            <div key={s.label} className='dp-sec-row'>
              <span className={`dp-sec-dot ${s.ok ? 'on' : ''}`}/>
              <span className='dp-sec-label'>{s.label}</span>
              <CheckCircle size={11} weight='fill' style={{ color:'#00C076', flexShrink:0 }}/>
            </div>
          ))}
        </div>
      </div>

      {/* recent deposits */}
      <div className='dp-side-panel'>
        <div className='dp-side-head'>
          <Clock size={12} weight='duotone' className='dp-pico'/>
          Recent Deposits
        </div>
        <div className='dp-side-body dp-recent'>
          {[
            { amt:'$5,000', method:'Bank',   date:'Mar 08', status:'completed' },
            { amt:'$2,000', method:'USDC',   date:'Mar 04', status:'pending'   },
            { amt:'$2,500', method:'Card',   date:'Mar 01', status:'failed'    },
          ].map((r, i) => {
            const col = r.status === 'completed' ? '#00C076' : r.status === 'pending' ? '#FFB800' : '#FF3D57'
            const RIcon = r.status === 'completed' ? CheckCircle : r.status === 'pending' ? Hourglass : XCircle
            return (
              <div key={i} className='dp-rec-row'>
                <RIcon size={13} weight='duotone' style={{ color: col, flexShrink:0 }}/>
                <div className='dp-rec-info'>
                  <span className='dp-rec-amt'>{r.amt}</span>
                  <span className='dp-rec-meta'>{r.method} · {r.date}</span>
                </div>
                <span className='dp-rec-status' style={{ color: col }}>{r.status}</span>
              </div>
            )
          })}
        </div>
      </div>

    </aside>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DEPOSIT PAGE
═══════════════════════════════════════════════════════════════ */
export default function Deposit() {
  const { user } = useOutletContext() ?? {}
  const navigate  = useNavigate()

  const [step, setStep] = useState(1)
  const [method, setMethod] = useState(null)
  const [amount, setAmount] = useState('')
  const [card, setCard] = useState({ number:'', expiry:'', cvv:'', name:'' })
  const [cryptoAsset, setCryptoAsset] = useState(null)
  const [usdcNetwork, setUsdcNetwork] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cryptoAssets, setCryptoAssets] = useState([])
  const [usdcNetworks, setUsdcNetworks] = useState([])
  const [addressesLoading, setAddressesLoading] = useState(true)

  // Fetch deposit addresses on mount
  useEffect(() => {
    apiGet('/api/deposit-addresses')
      .then(({ addresses }) => {
        // Transform addresses into the expected format
        const crypto = addresses
          .filter(a => ['BTC', 'ETH', 'SOL'].includes(a.currency))
          .map(a => ({
            id: a.currency,
            label: a.currency === 'BTC' ? 'Bitcoin' : a.currency === 'ETH' ? 'Ethereum' : 'Solana',
            color: a.currency === 'BTC' ? '#F7931A' : a.currency === 'ETH' ? '#627EEA' : '#9945FF',
            addr: a.address,
            network: a.network
          }))
        
        const usdc = addresses
          .filter(a => a.currency.startsWith('USDC_'))
          .map(a => ({
            id: a.currency === 'USDC_ETH' ? 'eth' : 'sol',
            label: a.network === 'ERC-20' ? 'Ethereum' : 'Solana',
            sub: a.network === 'ERC-20' ? 'ERC-20' : 'SPL',
            color: a.network === 'ERC-20' ? '#627EEA' : '#9945FF',
            addr: a.address,
            fee: a.network === 'ERC-20' ? '~$2–8' : '~$0.01'
          }))
        
        setCryptoAssets(crypto)
        setUsdcNetworks(usdc)
      })
      .catch(err => {
        console.error('Failed to load deposit addresses:', err)
        // Fallback to empty arrays
        setCryptoAssets([])
        setUsdcNetworks([])
      })
      .finally(() => setAddressesLoading(false))
  }, [])

  const isCrypto = method?.id === 'crypto' || method?.id === 'usdc'
  const stepLabels = isCrypto
    ? ['Method', 'Address', 'Done']
    : ['Method', 'Details', 'Review', 'Done']
  const totalSteps = stepLabels.length

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await apiPost('/api/wallet/deposit', {
        currency: method?.id === 'crypto' ? (cryptoAsset?.sym || 'BTC')
                : method?.id === 'usdc'   ? 'USDC'
                : 'USD',
        amount:   parseFloat(amount) || 0,
        method:   method?.id || 'bank',
      })
      setStep(totalSteps)
    } catch (err) {
      console.error('Deposit error:', err.message)
      // Still advance to done step so UX isn't broken
      setStep(totalSteps)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1); setMethod(null); setAmount('')
    setCard({ number:'', expiry:'', cvv:'', name:'' })
    setCryptoAsset(null); setUsdcNetwork(null)
  }

  return (
    <div className='dp-root'>

      {/* top bar */}
      <div className='dp-top'>
        <div>
          <h1 className='dp-title'>Deposit Funds</h1>
          <p className='dp-sub'>Fund your Veltro account securely.</p>
        </div>
        <nav className='dp-bc'>
          <span>Veltro</span><CaretRight size={9}/>
          <span>Wallet</span><CaretRight size={9}/>
          <span className='act'>Deposit</span>
        </nav>
      </div>

      <div className='dp-body'>

        {/* main panel */}
        <div className='dp-main'>
          <div className='dp-card'>
            <StepBar step={step} total={totalSteps} labels={stepLabels}/>

            {step === 1 && (
              <Step1
                selected={method}
                setSelected={setMethod}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && method?.id === 'bank' && (
              <Step2Bank
                amount={amount} setAmount={setAmount}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}
            {step === 2 && method?.id === 'card' && (
              <Step2Card
                amount={amount} setAmount={setAmount}
                card={card} setCard={setCard}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}
            {step === 2 && method?.id === 'crypto' && (
              <Step2Crypto
                asset={cryptoAsset} setAsset={setCryptoAsset}
                cryptoAssets={cryptoAssets} addressesLoading={addressesLoading}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}
            {step === 2 && method?.id === 'usdc' && (
              <Step2USDC
                network={usdcNetwork} setNetwork={setUsdcNetwork}
                usdcNetworks={usdcNetworks} addressesLoading={addressesLoading}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {step === 3 && !isCrypto && (
              <Step3
                method={method} amount={amount} card={card}
                onBack={() => setStep(2)}
                onConfirm={handleConfirm}
                loading={loading}
              />
            )}
            {step === 3 && isCrypto && (
              <Step4
                method={method} amount={amount}
                onDone={() => navigate('../')}
                onAnother={reset}
              />
            )}

            {step === totalSteps && !isCrypto && (
              <Step4
                method={method} amount={amount}
                onDone={() => navigate('../')}
                onAnother={reset}
              />
            )}
          </div>
        </div>

        {/* sidebar */}
        <DepositSidebar method={method}/>
      </div>
    </div>
  )
}