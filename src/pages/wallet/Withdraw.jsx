import { useState, useRef, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { apiPost } from '../../utils/api.js'
import {
  CaretRight, CaretLeft, CaretDown, CheckCircle, Check,
  Bank, CurrencyBtc, CurrencyEth, CurrencyDollar, Coins,
  ArrowCircleUp, ShieldCheck, Clock, Info, Warning,
  Lightning, Wallet, Copy, LockSimple, Spinner,
  XCircle, Hourglass, ArrowRight, Plus, Trash,
  DeviceMobile, Key,
} from '@phosphor-icons/react'
import './Withdraw.css'

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
const ASSETS = [
  { id:'USD',  label:'US Dollar',  sym:'USD',  bal:8_420.00, avail:8_420.00, color:'#00C076', Icon:CurrencyDollar, decimals:2  },
  { id:'BTC',  label:'Bitcoin',    sym:'BTC',  bal:0.4812,   avail:0.4612,   color:'#F7931A', Icon:CurrencyBtc,   decimals:6  },
  { id:'ETH',  label:'Ethereum',   sym:'ETH',  bal:3.812,    avail:3.312,    color:'#627EEA', Icon:CurrencyEth,   decimals:4  },
  { id:'SOL',  label:'Solana',     sym:'SOL',  bal:42.6,     avail:42.6,     color:'#9945FF', Icon:Coins,         decimals:2  },
  { id:'USDC', label:'USD Coin',   sym:'USDC', bal:2_280.00, avail:2_280.00, color:'#2775CA', Icon:CurrencyDollar,decimals:2  },
]

const USD_RATES = { USD:1, BTC:67_420, ETH:3_210, SOL:142.4, USDC:1 }

const METHODS = [
  {
    id: 'bank',
    label: 'Bank Transfer',
    sub: 'ACH / Wire',
    Icon: Bank,
    color: '#1A56FF',
    fee: 'Free',
    feeAmt: 0,
    time: '1-3 business days',
    min: 50,
    max: 10_000,
    daily: 10_000,
    assets: ['USD'],
    desc: 'Withdraw USD directly to your linked bank account. ACH withdrawals are free.',
  },
  {
    id: 'crypto',
    label: 'Crypto Withdrawal',
    sub: 'BTC · ETH · SOL',
    Icon: CurrencyBtc,
    color: '#F7931A',
    fee: 'Network fee',
    feeAmt: null,
    time: '10-60 min',
    min: null,
    max: null,
    daily: null,
    assets: ['BTC','ETH','SOL'],
    desc: 'Send crypto to any external wallet. Network fee deducted from withdrawal amount.',
  },
  {
    id: 'usdc',
    label: 'USDC / Stablecoin',
    sub: 'ERC-20 · Solana',
    Icon: CurrencyDollar,
    color: '#2775CA',
    fee: 'Network fee',
    feeAmt: null,
    time: '2-15 min',
    min: 10,
    max: 50_000,
    daily: 25_000,
    assets: ['USDC'],
    desc: 'Withdraw USDC stablecoins to an external wallet on Ethereum or Solana.',
  },
]

const CRYPTO_FEES = { BTC: 0.0002, ETH: 0.003, SOL: 0.01 }

const SAVED_ADDRESSES = [
  { id:1, label:'My Ledger',      asset:'BTC',  addr:'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', verified:true  },
  { id:2, label:'MetaMask ETH',   asset:'ETH',  addr:'0x71C7656EC7ab88b098defB751B7401B5f6d8976F', verified:true  },
  { id:3, label:'Phantom Wallet', asset:'SOL',  addr:'7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', verified:true  },
  { id:4, label:'Chase Checking', asset:'USD',  addr:'•••• 4821', verified:true  },
]

const USDC_NETWORKS = [
  { id:'eth', label:'Ethereum', sub:'ERC-20', color:'#627EEA', fee:'~$2-8',    feeAmt: 4   },
  { id:'sol', label:'Solana',   sub:'SPL',    color:'#9945FF', fee:'~$0.01',   feeAmt: 0.01},
]

const RECENT_WD = [
  { amt:'$2,000', method:'Bank',   date:'Mar 06', status:'completed' },
  { amt:'0.05 BTC', method:'Crypto', date:'Mar 03', status:'completed' },
  { amt:'$1,200', method:'USDC',   date:'Feb 28', status:'pending'   },
]

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const fmt$ = (n, d=2) =>
  `$${Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})}`
const fmtCrypto = (n, sym, dec) => `${Number(n).toFixed(dec)} ${sym}`
const usdOf = (n, sym) => (parseFloat(n)||0) * (USD_RATES[sym]||1)

/* ═══════════════════════════════════════════════════════════════
   STEP BAR
═══════════════════════════════════════════════════════════════ */
function StepBar({ step, labels }) {
  return (
    <div className='wd-steps'>
      {labels.map((lbl, i) => {
        const idx    = i + 1
        const done   = idx < step
        const active = idx === step
        return (
          <div key={i} className={`wd-step ${done?'done':''} ${active?'active':''}`}>
            <div className='wd-step-circle'>
              {done ? <Check size={11} weight='bold'/> : idx}
            </div>
            <span className='wd-step-label'>{lbl}</span>
            {i < labels.length - 1 && <div className={`wd-step-line ${done?'done':''}`}/>}
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
      className={`wd-method-card ${selected?'on':''}`}
      style={{'--mc': method.color}}
      onClick={onClick}
    >
      <div className='wd-mc-icon' style={{background:`${method.color}18`, color:method.color}}>
        <Icon size={22} weight='duotone'/>
      </div>
      <div className='wd-mc-info'>
        <span className='wd-mc-label'>{method.label}</span>
        <span className='wd-mc-sub'>{method.sub}</span>
      </div>
      <div className='wd-mc-right'>
        <span className='wd-mc-fee' style={{color: method.fee==='Free'?'#00C076':'var(--vlt-text-muted)'}}>
          {method.fee}
        </span>
        <span className='wd-mc-time'><Clock size={9} weight='bold'/>{method.time}</span>
      </div>
      <div className='wd-mc-check'><Check size={11} weight='bold'/></div>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ASSET PICKER DROPDOWN
═══════════════════════════════════════════════════════════════ */
function AssetPicker({ assets, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  const selected = ASSETS.find(a => a.id === value)
  const Icon = selected?.Icon || CurrencyDollar

  return (
    <div className='wd-asset-picker' ref={ref}>
      <button className='wd-ap-trigger' onClick={() => setOpen(o => !o)}>
        <span className='wd-ap-dot' style={{background: selected?.color}}/>
        <span className='wd-ap-icon' style={{background:`${selected?.color}18`, color:selected?.color}}>
          <Icon size={13} weight='duotone'/>
        </span>
        <span className='wd-ap-sym'>{selected?.sym}</span>
        <span className='wd-ap-name'>{selected?.label}</span>
        <CaretDown size={11} weight='bold' className={`wd-ap-caret ${open?'open':''}`}/>
      </button>
      {open && (
        <div className='wd-ap-dropdown'>
          {assets.map(id => {
            const a = ASSETS.find(x => x.id === id)
            if (!a) return null
            const AIco = a.Icon
            return (
              <button key={id} className={`wd-ap-option ${value===id?'on':''}`}
                onClick={() => { onChange(id); setOpen(false) }}>
                <span className='wd-ap-dot' style={{background:a.color}}/>
                <span className='wd-ap-icon sm' style={{background:`${a.color}18`,color:a.color}}>
                  <AIco size={12} weight='duotone'/>
                </span>
                <span className='wd-ap-sym'>{a.sym}</span>
                <span className='wd-ap-name'>{a.label}</span>
                <span className='wd-ap-bal'>
                  {a.id==='USD'||a.id==='USDC' ? fmt$(a.avail) : fmtCrypto(a.avail, a.sym, a.decimals)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 1 -- METHOD
═══════════════════════════════════════════════════════════════ */
function Step1({ selected, setSelected, onNext }) {
  return (
    <div className='wd-step-body'>
      <div className='wd-section-head'>
        <h2 className='wd-section-title'>Withdrawal method</h2>
        <p className='wd-section-sub'>Choose how you'd like to receive your funds.</p>
      </div>

      <div className='wd-methods'>
        {METHODS.map(m => (
          <MethodCard key={m.id} method={m} selected={selected?.id===m.id} onClick={()=>setSelected(m)}/>
        ))}
      </div>

      {selected && (
        <div className='wd-method-desc'>
          <Info size={13} weight='duotone' style={{color:selected.color, flexShrink:0}}/>
          <span>{selected.desc}</span>
          {selected.min && (
            <span className='wd-desc-limits'>
              Min {fmt$(selected.min,0)} · Max {fmt$(selected.max,0)}/txn · Daily limit {fmt$(selected.daily,0)}
            </span>
          )}
        </div>
      )}

      <div className='wd-foot'>
        <div/>
        <button className='wd-btn-primary' disabled={!selected} onClick={onNext}>
          Continue <CaretRight size={14} weight='bold'/>
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 2 -- DETAILS
═══════════════════════════════════════════════════════════════ */
function Step2Bank({ assetId, setAssetId, amount, setAmount, destination, setDestination, onBack, onNext }) {
  const m      = METHODS.find(x => x.id==='bank')
  const asset  = ASSETS.find(a => a.id==='USD')
  const numAmt = parseFloat(amount) || 0
  const valid  = numAmt >= m.min && numAmt <= Math.min(m.max, asset.avail) && destination.trim()

  const QUICK = [500, 1_000, 2_500, 5_000]

  return (
    <div className='wd-step-body'>
      <div className='wd-section-head'>
        <h2 className='wd-section-title'>Bank Transfer</h2>
        <p className='wd-section-sub'>Withdraw USD to your linked bank account.</p>
      </div>

      {/* balance badge */}
      <div className='wd-balance-badge'>
        <Wallet size={13} weight='duotone' style={{color:'#1A56FF'}}/>
        <span>Available balance:</span>
        <strong>{fmt$(asset.avail)}</strong>
        <button className='wd-max-btn' onClick={()=>setAmount(String(asset.avail))}>MAX</button>
      </div>

      {/* amount */}
      <div className='wd-field-group'>
        <label className='wd-label'>Amount (USD)</label>
        <div className='wd-amount-wrap'>
          <span className='wd-currency-sym'>$</span>
          <input
            className='wd-amount-input' type='number' min={m.min} max={asset.avail}
            step='0.01' placeholder='0.00'
            value={amount} onChange={e => setAmount(e.target.value)}
          />
          {numAmt > 0 && (
            <span className='wd-usd-equiv'>{fmt$(usdOf(numAmt,'USD'))}</span>
          )}
        </div>
        <div className='wd-quick-row'>
          {QUICK.map(q => (
            <button key={q} className='wd-quick-chip' onClick={()=>setAmount(String(Math.min(q, asset.avail)))}>
              ${q.toLocaleString()}
            </button>
          ))}
        </div>
        {numAmt > asset.avail && (
          <span className='wd-error'><Warning size={11} weight='fill'/> Exceeds available balance</span>
        )}
      </div>

      {/* destination */}
      <div className='wd-field-group'>
        <label className='wd-label'>Destination Bank Account</label>
        <div className='wd-saved-addrs'>
          {SAVED_ADDRESSES.filter(a => a.asset==='USD').map(s => (
            <button key={s.id}
              className={`wd-saved-addr ${destination===s.addr?'on':''}`}
              onClick={()=>setDestination(s.addr)}>
              <Bank size={13} weight='duotone' style={{color:'#1A56FF'}}/>
              <div className='wd-sa-info'>
                <span className='wd-sa-label'>{s.label}</span>
                <span className='wd-sa-addr'>{s.addr}</span>
              </div>
              {s.verified && <ShieldCheck size={13} weight='fill' style={{color:'#00C076', flexShrink:0}}/>}
            </button>
          ))}
        </div>
        <button className='wd-add-dest'>
          <Plus size={12} weight='bold'/>Link a new bank account
        </button>
      </div>

      <div className='wd-info-row-sm'>
        <Info size={11} weight='duotone' style={{color:'#1A56FF'}}/>
        Free ACH transfer · Arrives within 1-3 business days
      </div>

      <div className='wd-foot'>
        <button className='wd-btn-ghost' onClick={onBack}><CaretLeft size={13} weight='bold'/>Back</button>
        <button className='wd-btn-primary' disabled={!valid} onClick={onNext}>
          Review Withdrawal <CaretRight size={14} weight='bold'/>
        </button>
      </div>
    </div>
  )
}

function Step2Crypto({ assetId, setAssetId, amount, setAmount, destination, setDestination, onBack, onNext }) {
  const asset   = ASSETS.find(a => a.id === assetId) || ASSETS[1]
  const fee     = CRYPTO_FEES[assetId] || 0
  const numAmt  = parseFloat(amount) || 0
  const receive = Math.max(0, numAmt - fee)
  const usdRecv = usdOf(receive, assetId)
  const valid   = numAmt > fee && numAmt <= asset.avail && destination.trim().length > 10

  const savedForAsset = SAVED_ADDRESSES.filter(a => a.asset === assetId)

  const QUICK_PCT = [25, 50, 75, 100]

  return (
    <div className='wd-step-body'>
      <div className='wd-section-head'>
        <h2 className='wd-section-title'>Crypto Withdrawal</h2>
        <p className='wd-section-sub'>Send to any external wallet address.</p>
      </div>

      {/* asset selector */}
      <div className='wd-field-group'>
        <label className='wd-label'>Asset</label>
        <AssetPicker
          assets={METHODS.find(m=>m.id==='crypto').assets}
          value={assetId}
          onChange={id => { setAssetId(id); setAmount(''); setDestination('') }}
        />
      </div>

      {/* balance */}
      <div className='wd-balance-badge'>
        <Wallet size={13} weight='duotone' style={{color: asset.color}}/>
        <span>Available:</span>
        <strong style={{color: asset.color}}>{fmtCrypto(asset.avail, asset.sym, asset.decimals)}</strong>
        <span className='wd-bb-usd'>≈ {fmt$(usdOf(asset.avail, assetId))}</span>
        <button className='wd-max-btn' onClick={()=>setAmount(String(asset.avail))}>MAX</button>
      </div>

      {/* amount */}
      <div className='wd-field-group'>
        <label className='wd-label'>Amount ({asset.sym})</label>
        <div className='wd-amount-wrap'>
          <span className='wd-asset-badge' style={{color: asset.color}}>{asset.sym}</span>
          <input
            className='wd-amount-input' type='number' step='any' placeholder='0.000000'
            value={amount} onChange={e => setAmount(e.target.value)}
          />
          {numAmt > 0 && (
            <span className='wd-usd-equiv'>≈ {fmt$(usdOf(numAmt, assetId))}</span>
          )}
        </div>
        <div className='wd-quick-row'>
          {QUICK_PCT.map(p => (
            <button key={p} className='wd-quick-chip'
              onClick={()=>setAmount(String(+(asset.avail*(p/100)).toFixed(asset.decimals)))}>
              {p}%
            </button>
          ))}
        </div>
        {numAmt > 0 && (
          <div className='wd-fee-strip'>
            <span>Amount: {fmtCrypto(numAmt, asset.sym, asset.decimals)}</span>
            <span>Network fee: {fmtCrypto(fee, asset.sym, asset.decimals)}</span>
            <span className='wd-fee-recv'>
              You receive: <strong>{fmtCrypto(receive, asset.sym, asset.decimals)}</strong>
              <span className='wd-fee-usd'>≈ {fmt$(usdRecv)}</span>
            </span>
          </div>
        )}
        {numAmt > asset.avail && (
          <span className='wd-error'><Warning size={11} weight='fill'/> Exceeds available balance</span>
        )}
      </div>

      {/* destination */}
      <div className='wd-field-group'>
        <label className='wd-label'>Destination Address</label>
        {savedForAsset.length > 0 && (
          <div className='wd-saved-addrs'>
            {savedForAsset.map(s => (
              <button key={s.id}
                className={`wd-saved-addr ${destination===s.addr?'on':''}`}
                onClick={()=>setDestination(s.addr)}>
                <asset.Icon size={13} weight='duotone' style={{color: asset.color}}/>
                <div className='wd-sa-info'>
                  <span className='wd-sa-label'>{s.label}</span>
                  <span className='wd-sa-addr'>{s.addr.slice(0,18)}...</span>
                </div>
                {s.verified && <ShieldCheck size={13} weight='fill' style={{color:'#00C076', flexShrink:0}}/>}
              </button>
            ))}
          </div>
        )}
        <div className='wd-addr-input-wrap'>
          <input
            className='wd-input wd-addr-input'
            placeholder={`Enter ${asset.sym} wallet address...`}
            value={destination}
            onChange={e => setDestination(e.target.value)}
          />
        </div>
        <div className='wd-addr-warn'>
          <Warning size={11} weight='fill'/>
          Only send to a {asset.label} address. Sending to a wrong network results in permanent loss.
        </div>
      </div>

      <div className='wd-foot'>
        <button className='wd-btn-ghost' onClick={onBack}><CaretLeft size={13} weight='bold'/>Back</button>
        <button className='wd-btn-primary' disabled={!valid} onClick={onNext}>
          Review Withdrawal <CaretRight size={14} weight='bold'/>
        </button>
      </div>
    </div>
  )
}

function Step2USDC({ usdcNet, setUsdcNet, amount, setAmount, destination, setDestination, onBack, onNext }) {
  const asset   = ASSETS.find(a => a.id==='USDC')
  const netObj  = USDC_NETWORKS.find(n => n.id === usdcNet)
  const fee     = netObj?.feeAmt || 0
  const numAmt  = parseFloat(amount) || 0
  const receive = Math.max(0, numAmt - fee)
  const valid   = numAmt >= 10 && numAmt <= asset.avail && destination.trim().length > 10 && usdcNet

  const QUICK = [100, 500, 1_000, 2_000]

  return (
    <div className='wd-step-body'>
      <div className='wd-section-head'>
        <h2 className='wd-section-title'>USDC Withdrawal</h2>
        <p className='wd-section-sub'>Send USDC to any external wallet.</p>
      </div>

      <div className='wd-balance-badge'>
        <Wallet size={13} weight='duotone' style={{color:'#2775CA'}}/>
        <span>Available:</span>
        <strong style={{color:'#2775CA'}}>{fmt$(asset.avail)} USDC</strong>
        <button className='wd-max-btn' onClick={()=>setAmount(String(asset.avail))}>MAX</button>
      </div>

      {/* network */}
      <div className='wd-field-group'>
        <label className='wd-label'>Network</label>
        <div className='wd-network-cards'>
          {USDC_NETWORKS.map(n => (
            <button key={n.id}
              className={`wd-network-card ${usdcNet===n.id?'on':''}`}
              style={{'--nc': n.color}}
              onClick={()=>setUsdcNet(n.id)}>
              <div className='wd-nc-dot' style={{background: n.color}}/>
              <div className='wd-nc-info'>
                <span className='wd-nc-label'>{n.label}</span>
                <span className='wd-nc-sub'>{n.sub}</span>
              </div>
              <span className='wd-nc-fee'>{n.fee} fee</span>
            </button>
          ))}
        </div>
      </div>

      {/* amount */}
      <div className='wd-field-group'>
        <label className='wd-label'>Amount (USDC)</label>
        <div className='wd-amount-wrap'>
          <span className='wd-asset-badge' style={{color:'#2775CA'}}>USDC</span>
          <input
            className='wd-amount-input' type='number' placeholder='0.00'
            value={amount} onChange={e=>setAmount(e.target.value)}
          />
        </div>
        <div className='wd-quick-row'>
          {QUICK.map(q=>(
            <button key={q} className='wd-quick-chip' onClick={()=>setAmount(String(Math.min(q,asset.avail)))}>
              ${q.toLocaleString()}
            </button>
          ))}
        </div>
        {numAmt > 0 && fee > 0 && (
          <div className='wd-fee-strip'>
            <span>Amount: {fmt$(numAmt)} USDC</span>
            <span>Network fee: ≈ {fmt$(fee)}</span>
            <span className='wd-fee-recv'>You receive: <strong>{fmt$(receive)} USDC</strong></span>
          </div>
        )}
      </div>

      {/* destination */}
      <div className='wd-field-group'>
        <label className='wd-label'>Destination Wallet Address</label>
        <input
          className='wd-input'
          placeholder={usdcNet==='sol' ? 'Solana wallet address...' : 'Ethereum wallet address (0x...)'}
          value={destination}
          onChange={e=>setDestination(e.target.value)}
        />
        {destination && destination.length > 5 && (
          <div className='wd-addr-verify'>
            <ShieldCheck size={11} weight='fill' style={{color:'#00C076'}}/>
            Address format looks valid
          </div>
        )}
        <div className='wd-addr-warn'>
          <Warning size={11} weight='fill'/>
          Only send to {usdcNet==='sol'?'Solana':'ERC-20'} compatible addresses.
        </div>
      </div>

      <div className='wd-foot'>
        <button className='wd-btn-ghost' onClick={onBack}><CaretLeft size={13} weight='bold'/>Back</button>
        <button className='wd-btn-primary' disabled={!valid} onClick={onNext}>
          Review Withdrawal <CaretRight size={14} weight='bold'/>
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 3 -- 2FA CONFIRM
═══════════════════════════════════════════════════════════════ */
function Step3({ method, assetId, amount, destination, usdcNet, onBack, onConfirm, loading }) {
  const [code,     setCode]     = useState('')
  const [mode2fa,  setMode2fa]  = useState('app') // 'app' | 'sms'
  const refs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()]

  const asset  = ASSETS.find(a => a.id === assetId) || ASSETS.find(a=>a.id==='USD')
  const Icon   = method.Icon
  const numAmt = parseFloat(amount) || 0

  const fee = method.id==='crypto'
    ? (CRYPTO_FEES[assetId]||0)
    : method.id==='usdc'
    ? (USDC_NETWORKS.find(n=>n.id===usdcNet)?.feeAmt||0)
    : 0
  const receive = Math.max(0, numAmt - fee)

  const rows = method.id==='bank' ? [
    { label:'Method',    val:'Bank Transfer (ACH)' },
    { label:'Asset',     val:'USD' },
    { label:'Amount',    val:fmt$(numAmt) },
    { label:'Fee',       val:'Free' },
    { label:'Receiving', val:fmt$(numAmt), bold:true },
    { label:'To account',val: destination },
    { label:'Est. time', val: method.time },
  ] : method.id==='crypto' ? [
    { label:'Method',    val:'Crypto Withdrawal' },
    { label:'Asset',     val: assetId },
    { label:'Amount',    val:fmtCrypto(numAmt, assetId, asset.decimals) },
    { label:'Network fee',val:fmtCrypto(fee, assetId, asset.decimals) },
    { label:'You receive',val:fmtCrypto(receive, assetId, asset.decimals), bold:true },
    { label:'≈ USD value',val:fmt$(usdOf(receive, assetId)) },
    { label:'To address', val:`${destination.slice(0,14)}...${destination.slice(-6)}`, mono:true },
    { label:'Est. time',  val:method.time },
  ] : [
    { label:'Method',    val:'USDC Withdrawal' },
    { label:'Network',   val:USDC_NETWORKS.find(n=>n.id===usdcNet)?.label },
    { label:'Amount',    val:`${fmt$(numAmt)} USDC` },
    { label:'Network fee',val:`≈ ${fmt$(fee)}` },
    { label:'You receive',val:`${fmt$(receive)} USDC`, bold:true },
    { label:'To address', val:`${destination.slice(0,14)}...${destination.slice(-6)}`, mono:true },
    { label:'Est. time',  val:method.time },
  ]

  const handleDigit = (val, i) => {
    const digits = code.split('')
    digits[i] = val.slice(-1)
    const next = digits.join('')
    setCode(next)
    if (val && i < 5) refs[i+1]?.current?.focus()
  }
  const handleKey = (e, i) => {
    if (e.key==='Backspace' && !code[i] && i > 0) refs[i-1]?.current?.focus()
  }
  const codeValid = code.replace(/\D/g,'').length === 6

  return (
    <div className='wd-step-body'>
      <div className='wd-section-head'>
        <h2 className='wd-section-title'>Confirm & Verify</h2>
        <p className='wd-section-sub'>Review your withdrawal and enter your 2FA code.</p>
      </div>

      {/* summary */}
      <div className='wd-review-card'>
        <div className='wd-review-header'>
          <div className='wd-review-icon' style={{background:`${method.color}18`, color:method.color}}>
            <Icon size={20} weight='duotone'/>
          </div>
          <div>
            <div className='wd-review-method'>{method.label}</div>
            <div className='wd-review-amount'>
              {method.id==='bank'
                ? fmt$(numAmt)
                : fmtCrypto(receive, assetId, asset.decimals)
              }
            </div>
          </div>
          <div className='wd-review-badge'>
            <ArrowCircleUp size={13} weight='bold'/>Withdrawal
          </div>
        </div>
        <div className='wd-review-rows'>
          {rows.map(r => (
            <div key={r.label} className={`wd-review-row ${r.bold?'bold':''}`}>
              <span className='wd-rr-key'>{r.label}</span>
              <span className={`wd-rr-val ${r.mono?'mono':''}`}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2FA */}
      <div className='wd-2fa-panel'>
        <div className='wd-2fa-head'>
          <Key size={14} weight='duotone' style={{color:'var(--cy-neon)'}}/>
          <span>Two-Factor Authentication Required</span>
          <div className='wd-2fa-toggle'>
            <button className={`wd-2fa-mode ${mode2fa==='app'?'on':''}`} onClick={()=>setMode2fa('app')}>
              <Key size={11} weight='bold'/>Authenticator
            </button>
            <button className={`wd-2fa-mode ${mode2fa==='sms'?'on':''}`} onClick={()=>setMode2fa('sms')}>
              <DeviceMobile size={11} weight='bold'/>SMS
            </button>
          </div>
        </div>
        <p className='wd-2fa-sub'>
          {mode2fa==='app'
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Enter the code sent to your registered phone number.'}
        </p>
        <div className='wd-otp-row'>
          {Array.from({length:6}).map((_,i) => (
            <input
              key={i} ref={refs[i]}
              className='wd-otp-box'
              maxLength={1} inputMode='numeric' pattern='[0-9]'
              value={code[i]||''}
              onChange={e => handleDigit(e.target.value, i)}
              onKeyDown={e => handleKey(e, i)}
              onFocus={e => e.target.select()}
            />
          ))}
        </div>
        <div className='wd-2fa-hint'>
          <LockSimple size={11} weight='bold'/>
          This code expires in 30 seconds · <button className='wd-2fa-resend'>Resend code</button>
        </div>
      </div>

      <div className='wd-confirm-note'>
        <Warning size={13} weight='fill' style={{color:'#FFB800', flexShrink:0}}/>
        Crypto withdrawals are irreversible. Double-check the destination address before confirming.
      </div>

      <div className='wd-foot'>
        <button className='wd-btn-ghost' onClick={onBack} disabled={loading}>
          <CaretLeft size={13} weight='bold'/>Back
        </button>
        <button className='wd-btn-danger' onClick={onConfirm} disabled={!codeValid || loading}>
          {loading
            ? <><Spinner size={14} className='wd-spin'/>Processing...</>
            : <><ArrowCircleUp size={14} weight='bold'/>Confirm Withdrawal</>
          }
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 4 -- SUCCESS
═══════════════════════════════════════════════════════════════ */
function Step4({ method, assetId, amount, onDone, onAnother }) {
  const asset  = ASSETS.find(a=>a.id===assetId) || ASSETS.find(a=>a.id==='USD')
  const numAmt = parseFloat(amount)||0
  const isCrypto = method.id==='crypto' || method.id==='usdc'

  return (
    <div className='wd-step-body wd-success-body'>
      <div className='wd-success-ring'>
        <div className='wd-success-icon'>
          <ArrowCircleUp size={36} weight='fill'/>
        </div>
      </div>
      <h2 className='wd-success-title'>Withdrawal Submitted</h2>
      <p className='wd-success-sub'>
        {method.id==='bank'
          ? `Your ${fmt$(numAmt)} withdrawal has been submitted. Funds arrive in 1-3 business days.`
          : isCrypto
          ? `Your withdrawal is being broadcast to the network. It will arrive after confirmation.`
          : `Your USDC withdrawal has been submitted and is pending network confirmation.`
        }
      </p>

      <div className='wd-success-status'>
        <div className='wd-ss-row'>
          <Clock size={13} weight='duotone' style={{color:'#FFB800'}}/>
          <span>Status: <strong>Pending · {method.time}</strong></span>
        </div>
        <div className='wd-ss-row'>
          <ShieldCheck size={13} weight='duotone' style={{color:'#00C076'}}/>
          <span>Ref: <strong>VLT-WD-{Date.now().toString().slice(-8)}</strong></span>
        </div>
        <div className='wd-ss-row'>
          <Lightning size={13} weight='duotone' style={{color:'#1A56FF'}}/>
          <span>Email confirmation sent to your registered address</span>
        </div>
      </div>

      <div className='wd-success-actions'>
        <button className='wd-btn-primary' onClick={onDone}>
          <Wallet size={14} weight='bold'/>Back to Wallet
        </button>
        <button className='wd-btn-ghost' onClick={onAnother}>
          <ArrowCircleUp size={14} weight='bold'/>New Withdrawal
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════ */
function WithdrawSidebar({ method }) {
  const limits = method ? [
    ...(method.min   ? [{label:'Min per transaction', val:`${fmt$(method.min,0)}`}]    : []),
    ...(method.max   ? [{label:'Max per transaction', val:`${fmt$(method.max,0)}`}]    : []),
    ...(method.daily ? [{label:'Daily limit',         val:`${fmt$(method.daily,0)}`}]  : []),
    {label:'Fee',      val: method.fee},
    {label:'Est. time',val: method.time},
  ] : []

  return (
    <aside className='wd-sidebar'>

      {/* portfolio available */}
      <div className='wd-side-panel wd-avail-panel'>
        <div className='wd-side-head'>
          <Wallet size={12} weight='duotone' className='wd-pico'/>
          Available Balances
        </div>
        <div className='wd-side-body'>
          {ASSETS.map(a => {
            const Icon = a.Icon
            const pct  = (a.avail/a.bal)*100
            return (
              <div key={a.id} className='wd-avail-row'>
                <div className='wd-avail-icon' style={{background:`${a.color}18`, color:a.color}}>
                  <Icon size={12} weight='duotone'/>
                </div>
                <div className='wd-avail-info'>
                  <span className='wd-avail-sym'>{a.sym}</span>
                  <span className='wd-avail-val'>
                    {a.id==='USD'||a.id==='USDC' ? fmt$(a.avail) : fmtCrypto(a.avail,a.sym,a.decimals)}
                  </span>
                </div>
                <div className='wd-avail-bar'>
                  <div className='wd-avail-fill' style={{width:`${pct}%`, background:a.color}}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* method limits */}
      {method && (
        <div className='wd-side-panel'>
          <div className='wd-side-head'>
            <Info size={12} weight='duotone' className='wd-pico'/>
            Method Limits
          </div>
          <div className='wd-side-body'>
            <div className='wd-side-method-row'>
              <div className='wd-smi' style={{background:`${method.color}18`,color:method.color}}>
                <method.Icon size={14} weight='duotone'/>
              </div>
              <div>
                <div className='wd-sml'>{method.label}</div>
                <div className='wd-sms'>{method.sub}</div>
              </div>
            </div>
            {limits.map(l=>(
              <div key={l.label} className='wd-side-row'>
                <span className='wd-sr-key'>{l.label}</span>
                <span className='wd-sr-val'>{l.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* security */}
      <div className='wd-side-panel'>
        <div className='wd-side-head'>
          <ShieldCheck size={12} weight='duotone' className='wd-pico'/>
          Security Controls
        </div>
        <div className='wd-side-body'>
          {[
            {label:'2FA Required',       ok:true},
            {label:'Whitelist Active',   ok:true},
            {label:'24h Hold (new addr)',ok:true},
            {label:'Withdrawal Lock',    ok:false},
          ].map(s=>(
            <div key={s.label} className='wd-sec-row'>
              <span className={`wd-sec-dot ${s.ok?'on':''}`}/>
              <span className='wd-sec-label'>{s.label}</span>
              <span className={`wd-sec-status ${s.ok?'on':'off'}`}>{s.ok?'Active':'Off'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* recent withdrawals */}
      <div className='wd-side-panel'>
        <div className='wd-side-head'>
          <Clock size={12} weight='duotone' className='wd-pico'/>
          Recent Withdrawals
        </div>
        <div className='wd-side-body wd-recent'>
          {RECENT_WD.map((r,i)=>{
            const col   = r.status==='completed'?'#00C076':r.status==='pending'?'#FFB800':'#FF3D57'
            const RIcon = r.status==='completed'?CheckCircle:r.status==='pending'?Hourglass:XCircle
            return (
              <div key={i} className='wd-rec-row'>
                <RIcon size={13} weight='duotone' style={{color:col,flexShrink:0}}/>
                <div className='wd-rec-info'>
                  <span className='wd-rec-amt'>{r.amt}</span>
                  <span className='wd-rec-meta'>{r.method} · {r.date}</span>
                </div>
                <span className='wd-rec-status' style={{color:col}}>{r.status}</span>
              </div>
            )
          })}
        </div>
      </div>

    </aside>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WITHDRAW PAGE
═══════════════════════════════════════════════════════════════ */
export default function Withdraw() {
  const { user } = useOutletContext() ?? {}
  const navigate  = useNavigate()

  const [step,        setStep]        = useState(1)
  const [method,      setMethod]      = useState(null)
  const [assetId,     setAssetId]     = useState('BTC')
  const [amount,      setAmount]      = useState('')
  const [destination, setDestination] = useState('')
  const [usdcNet,     setUsdcNet]     = useState('eth')
  const [loading,     setLoading]     = useState(false)

  const STEP_LABELS = ['Method', 'Details', 'Confirm', 'Done']

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await apiPost('/api/wallet/withdraw', {
        currency:    assetId,
        amount:      parseFloat(amount) || 0,
        method:      method?.id || 'bank',
        destination: destination || null,
      })
      setStep(4)
    } catch (err) {
      console.error('Withdraw error:', err.message)
      setStep(4)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1); setMethod(null); setAssetId('BTC')
    setAmount(''); setDestination(''); setUsdcNet('eth')
  }

  // sync assetId when method changes
  const handleSetMethod = (m) => {
    setMethod(m)
    if (m.assets?.length) setAssetId(m.assets[0])
    setAmount(''); setDestination('')
  }

  return (
    <div className='wd-root'>

      <div className='wd-top'>
        <div>
          <h1 className='wd-title'>Withdraw Funds</h1>
          <p className='wd-sub'>Send funds securely to your bank or external wallet.</p>
        </div>
        <nav className='wd-bc'>
          <span>Veltro</span><CaretRight size={9}/>
          <span>Wallet</span><CaretRight size={9}/>
          <span className='act'>Withdraw</span>
        </nav>
      </div>

      <div className='wd-body'>
        <div className='wd-main'>
          <div className='wd-card'>
            <StepBar step={step} labels={STEP_LABELS}/>

            {step===1 && (
              <Step1 selected={method} setSelected={handleSetMethod} onNext={()=>setStep(2)}/>
            )}
            {step===2 && method?.id==='bank' && (
              <Step2Bank
                assetId={assetId} setAssetId={setAssetId}
                amount={amount} setAmount={setAmount}
                destination={destination} setDestination={setDestination}
                onBack={()=>setStep(1)} onNext={()=>setStep(3)}
              />
            )}
            {step===2 && method?.id==='crypto' && (
              <Step2Crypto
                assetId={assetId} setAssetId={setAssetId}
                amount={amount} setAmount={setAmount}
                destination={destination} setDestination={setDestination}
                onBack={()=>setStep(1)} onNext={()=>setStep(3)}
              />
            )}
            {step===2 && method?.id==='usdc' && (
              <Step2USDC
                usdcNet={usdcNet} setUsdcNet={setUsdcNet}
                amount={amount} setAmount={setAmount}
                destination={destination} setDestination={setDestination}
                onBack={()=>setStep(1)} onNext={()=>setStep(3)}
              />
            )}
            {step===3 && (
              <Step3
                method={method} assetId={assetId} amount={amount}
                destination={destination} usdcNet={usdcNet}
                onBack={()=>setStep(2)} onConfirm={handleConfirm} loading={loading}
              />
            )}
            {step===4 && (
              <Step4
                method={method} assetId={assetId} amount={amount}
                onDone={()=>navigate('../')} onAnother={reset}
              />
            )}
          </div>
        </div>

        <WithdrawSidebar method={method}/>
      </div>
    </div>
  )
}