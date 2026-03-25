import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../../utils/api.js'
import {
  CaretRight, ArrowsLeftRight, CheckCircle, Check,
  CaretDown, Clock, Info, ShieldCheck, Spinner,
  CurrencyDollar, CurrencyBtc, CurrencyEth, Coins, Warning,
} from '@phosphor-icons/react'
import './Transfer.css'

const ASSETS = [
  { id:'USD',  sym:'USD',  label:'US Dollar',  color:'#00C076', Icon:CurrencyDollar },
  { id:'USDC', sym:'USDC', label:'USD Coin',   color:'#2775CA', Icon:CurrencyDollar },
  { id:'BTC',  sym:'BTC',  label:'Bitcoin',    color:'#F7931A', Icon:CurrencyBtc   },
  { id:'ETH',  sym:'ETH',  label:'Ethereum',   color:'#627EEA', Icon:CurrencyEth   },
  { id:'SOL',  sym:'SOL',  label:'Solana',     color:'#9945FF', Icon:Coins         },
]

const RATES = { USD:1, USDC:1, BTC:67420, ETH:3210, SOL:142.4 }

function AssetDropdown({ value, onChange, exclude }) {
  const [open, setOpen] = useState(false)
  const sel = ASSETS.find(a => a.id === value)
  return (
    <div className="tf-dropdown" onClick={() => setOpen(o => !o)}>
      {sel && (
        <div className="tf-sel-trigger">
          <span className="tf-sel-dot" style={{ background: sel.color }}/>
          <sel.Icon size={14} weight="duotone" style={{ color: sel.color }}/>
          <span className="tf-sel-sym">{sel.sym}</span>
          <span className="tf-sel-name">{sel.label}</span>
          <CaretDown size={10} weight="bold" className={`tf-caret ${open?'open':''}`}/>
        </div>
      )}
      {open && (
        <div className="tf-dropdown-menu" onClick={e => e.stopPropagation()}>
          {ASSETS.filter(a => a.id !== exclude).map(a => (
            <button key={a.id} className={`tf-dd-opt ${value === a.id ? 'on' : ''}`}
              onClick={() => { onChange(a.id); setOpen(false) }}>
              <span className="tf-sel-dot" style={{ background: a.color }}/>
              <a.Icon size={13} weight="duotone" style={{ color: a.color }}/>
              <span className="tf-sel-sym">{a.sym}</span>
              <span className="tf-sel-name">{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Transfer() {
  const navigate    = useNavigate()
  const [from, setFrom]       = useState('USD')
  const [to, setTo]           = useState('BTC')
  const [amount, setAmount]   = useState('')
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [rates, setRates]     = useState(null)
  const [balances, setBalances] = useState({})

  useEffect(() => {
    Promise.all([
      apiGet('/api/transfer/rates').catch(() => null),
      apiGet('/api/wallet/balances').catch(() => null),
    ]).then(([r, b]) => {
      if (r?.rates) setRates(r.rates)
      if (b?.balances) {
        const map = {}
        b.balances.forEach(w => { map[w.currency] = Number(w.balance) })
        setBalances(map)
      }
    })
  }, [])

  const fromAsset = ASSETS.find(a => a.id === from)
  const toAsset   = ASSETS.find(a => a.id === to)
  const numAmt    = parseFloat(amount) || 0

  const rate      = rates?.[from]?.[to] || (RATES[from] / RATES[to])
  const toAmount  = +(numAmt * rate).toFixed(8)
  const fromBal   = balances[from] || 0
  const valid     = numAmt > 0 && numAmt <= fromBal && from !== to

  const swap = () => { setFrom(to); setTo(from); setAmount('') }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const data = await apiPost('/api/transfer', {
        from_currency: from,
        to_currency:   to,
        from_amount:   numAmt,
      })
      setResult(data)
      setStep(3)
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n, sym) => {
    if (sym === 'USD' || sym === 'USDC') return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}`
    if (sym === 'BTC') return `${Number(n).toFixed(6)} BTC`
    if (sym === 'ETH') return `${Number(n).toFixed(4)} ETH`
    return `${Number(n).toFixed(2)} ${sym}`
  }

  return (
    <div className="tf-root">

      {/* Header */}
      <div className="tf-top">
        <div>
          <h1 className="tf-title">Convert / Transfer</h1>
          <p className="tf-sub">Swap between your wallet assets instantly.</p>
        </div>
        <nav className="tf-bc">
          <span>Veltro</span><CaretRight size={9}/>
          <span>Wallet</span><CaretRight size={9}/>
          <span className="act">Transfer</span>
        </nav>
      </div>

      <div className="tf-body">
        <div className="tf-card">

          {/* Step 1 -- Build transfer */}
          {step === 1 && (
            <div className="tf-step">
              <div className="tf-step-head">
                <ArrowsLeftRight size={15} weight="duotone" style={{ color:'#1A56FF' }}/>
                <h2>Convert Assets</h2>
              </div>

              {/* FROM */}
              <div className="tf-panel">
                <label className="tf-label">You send</label>
                <div className="tf-row">
                  <AssetDropdown value={from} onChange={v => { setFrom(v); if (v === to) setTo(from) }} exclude={null}/>
                  <input className="tf-amount-input" type="number" placeholder="0.00" step="any"
                    value={amount} onChange={e => setAmount(e.target.value)}/>
                </div>
                <div className="tf-bal-row">
                  Available: <strong>{fmt(fromBal, from)}</strong>
                  <button className="tf-max-btn" onClick={() => setAmount(String(fromBal))}>MAX</button>
                </div>
                {numAmt > fromBal && (
                  <div className="tf-error"><Warning size={11} weight="fill"/> Exceeds available balance</div>
                )}
              </div>

              {/* SWAP button */}
              <div className="tf-swap-row">
                <button className="tf-swap-btn" onClick={swap}>
                  <ArrowsLeftRight size={14} weight="bold"/>
                </button>
                {numAmt > 0 && (
                  <span className="tf-rate-pill">1 {from} = {rate.toFixed(6)} {to}</span>
                )}
              </div>

              {/* TO */}
              <div className="tf-panel">
                <label className="tf-label">You receive</label>
                <div className="tf-row">
                  <AssetDropdown value={to} onChange={v => { setTo(v); if (v === from) setFrom(to) }} exclude={from}/>
                  <div className="tf-receive-val">{numAmt > 0 ? fmt(toAmount, to) : '--'}</div>
                </div>
              </div>

              <div className="tf-info-row">
                <Info size={11} weight="duotone" style={{ color:'#1A56FF' }}/>
                No fees for internal asset conversion
              </div>

              <button className="tf-btn-primary" disabled={!valid} onClick={() => setStep(2)}>
                Review Transfer <CaretRight size={13} weight="bold"/>
              </button>
            </div>
          )}

          {/* Step 2 -- Review */}
          {step === 2 && (
            <div className="tf-step">
              <div className="tf-step-head">
                <Check size={15} weight="bold" style={{ color:'#00C076' }}/>
                <h2>Review Transfer</h2>
              </div>

              <div className="tf-review-card">
                {[
                  { label:'From',          val:`${fmt(numAmt, from)} (${from})` },
                  { label:'To',            val:`${fmt(toAmount, to)} (${to})` },
                  { label:'Exchange Rate', val:`1 ${from} = ${rate.toFixed(6)} ${to}` },
                  { label:'Fee',           val:'Free' },
                  { label:'Est. time',     val:'Instant' },
                ].map(r => (
                  <div key={r.label} className="tf-rr">
                    <span className="tf-rr-k">{r.label}</span>
                    <span className="tf-rr-v">{r.val}</span>
                  </div>
                ))}
              </div>

              <div className="tf-confirm-note">
                <ShieldCheck size={13} weight="fill" style={{ color:'#00C076' }}/>
                Conversion is instant and irreversible.
              </div>

              <div className="tf-foot">
                <button className="tf-btn-ghost" onClick={() => setStep(1)}>Back</button>
                <button className="tf-btn-primary" onClick={handleConfirm} disabled={loading}>
                  {loading
                    ? <><Spinner size={13} className="tf-spin"/> Processing...</>
                    : <><CheckCircle size={13} weight="bold"/> Confirm Transfer</>}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 -- Success */}
          {step === 3 && (
            <div className="tf-step tf-success">
              <div className="tf-success-ring">
                <CheckCircle size={40} weight="fill" style={{ color:'#00C076' }}/>
              </div>
              <h2 className="tf-success-title">Transfer Complete!</h2>
              <p className="tf-success-sub">
                {fmt(numAmt, from)} converted to {fmt(toAmount, to)} successfully.
              </p>
              <div className="tf-success-ref">
                Ref: <strong>{result?.reference || 'VLT-TRF-DONE'}</strong>
              </div>
              <div className="tf-foot">
                <button className="tf-btn-primary" onClick={() => navigate('../wallet')}>Back to Wallet</button>
                <button className="tf-btn-ghost" onClick={() => { setStep(1); setAmount(''); setResult(null) }}>New Transfer</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="tf-sidebar">
          <div className="tf-side-panel">
            <div className="tf-side-head"><Clock size={12} weight="duotone"/> Your Balances</div>
            {ASSETS.map(a => {
              const bal = balances[a.id] || 0
              return (
                <div key={a.id} className="tf-bal-row-s">
                  <span className="tf-bal-dot" style={{ background: a.color }}/>
                  <span className="tf-bal-sym">{a.sym}</span>
                  <span className="tf-bal-val">{fmt(bal, a.id)}</span>
                </div>
              )
            })}
          </div>
          <div className="tf-side-panel">
            <div className="tf-side-head"><Info size={12} weight="duotone"/> Live Rates</div>
            {[['BTC','USD'],['ETH','USD'],['SOL','USD']].map(([from, to]) => (
              <div key={from} className="tf-rate-row">
                <span className="tf-rate-pair">{from}/{to}</span>
                <span className="tf-rate-val">${RATES[from].toLocaleString()}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
