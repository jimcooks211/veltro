import { useState, useRef, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  IdentificationCard, CaretRight, Check, X, Upload,
  FilePdf, SealCheck, Hourglass, LockOpen, Info,
  Sparkle, ArrowRight, ArrowCounterClockwise, Certificate,
  CheckCircle,
} from '@phosphor-icons/react'
import './KYC.css'

/* ── tier data ──────────────────────────────────────────── */
const TIERS = [
  {
    id:1, label:'Tier 1 · Basic', name:'Starter', color:'#FFB800', status:'verified',
    limits:['$5K/day deposits','$2K/day withdrawals','Spot trading up to $10K'],
    req:['Valid email address'],
  },
  {
    id:2, label:'Tier 2 · Standard', name:'Verified', color:'#1A56FF', status:'verified',
    limits:['$25K/day deposits','$10K/day withdrawals','Full spot trading','API access enabled'],
    req:['Government photo ID','Proof of address (< 3 months)','Live selfie with ID'],
  },
  {
    id:3, label:'Tier 3 · Institutional', name:'Pro', color:'#00FFD1', status:'not_started',
    limits:['Unlimited deposits','Unlimited withdrawals','Institutional trading desk','Dedicated account manager','Custom fee structure'],
    req:['Business registration cert.','Director photo ID','Business proof of address','Compliance questionnaire','Source of funds documentation'],
  },
]

const DOC_SLOTS = [
  { id:'gov_id',  label:'Government ID',      hint:"Passport · Driver's license · National ID", accept:'image/*,.pdf' },
  { id:'address', label:'Proof of Address',   hint:'Utility bill or bank statement < 3 months',  accept:'image/*,.pdf' },
  { id:'selfie',  label:'Live Selfie with ID',hint:'Hold ID next to your face, good lighting',   accept:'image/*'      },
  { id:'biz_reg', label:'Business Reg. Cert.',hint:'Certificate of incorporation',                accept:'image/*,.pdf' },
  { id:'source',  label:'Source of Funds',    hint:'Bank statements or audited accounts',         accept:'image/*,.pdf' },
]

/* ── doc upload slot ────────────────────────────────────── */
function DocSlot({ slot, file, onFile }) {
  const ref = useRef()
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (file?.type?.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreview(null)
  }, [file])

  const onDrop = e => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) onFile(slot.id, f)
  }

  return (
    <div className={`ky-docslot ${file ? 'filled' : ''}`}
      onDragOver={e => e.preventDefault()} onDrop={onDrop}
      onClick={() => !file && ref.current?.click()}>
      <input ref={ref} type="file" accept={slot.accept} hidden
        onChange={e => e.target.files?.[0] && onFile(slot.id, e.target.files[0])}/>

      {file ? (
        <div className="ky-doc-filled">
          {preview
            ? <img src={preview} className="ky-doc-img" alt=""/>
            : <FilePdf size={26} weight="duotone" style={{color:'#FF3D57'}}/>
          }
          <span className="ky-doc-name">{file.name}</span>
          <div className="ky-doc-ok"><Check size={9} weight="bold"/></div>
          <button className="ky-doc-rm" onClick={e => { e.stopPropagation(); onFile(slot.id, null) }}>
            <X size={9} weight="bold"/>
          </button>
        </div>
      ) : (
        <div className="ky-doc-empty">
          <Upload size={18} weight="duotone" className="ky-doc-ico"/>
          <span className="ky-doc-lbl">{slot.label}</span>
          <span className="ky-doc-hint">{slot.hint}</span>
          <span className="ky-doc-types">JPG · PNG · PDF · max 10 MB</span>
        </div>
      )}
    </div>
  )
}

/* ── main ───────────────────────────────────────────────── */
export default function KYC() {
  useOutletContext?.()
  const [active, setActive] = useState(2)
  const [docs,   setDocs]   = useState({})
  const [phase,  setPhase]  = useState('view')   // 'view' | 'upload' | 'done'
  const [busy,   setBusy]   = useState(false)

  const handleFile = (id, file) => setDocs(d => ({ ...d, [id]: file }))
  const allDocs = DOC_SLOTS.every(s => docs[s.id])

  const submit = async () => {
    setBusy(true)
    await new Promise(r => setTimeout(r, 2000))
    setBusy(false); setPhase('done')
  }

  if (phase === 'done') return (
    <div className="ky-root">
      <div className="ky-success">
        <div className="ky-suc-ring"><SealCheck size={44} weight="fill" style={{color:'#00FFD1'}}/></div>
        <h3>Verification Submitted</h3>
        <p>Our compliance team reviews documents within 1–5 business days. You'll receive an email when your status updates.</p>
        <div className="ky-suc-ref">REF · KYC-{Date.now().toString().slice(-8).toUpperCase()}</div>
        <button className="ky-primary-btn" onClick={() => { setPhase('view'); setDocs({}) }}>
          <ArrowCounterClockwise size={13} weight="bold"/>Back to overview
        </button>
      </div>
    </div>
  )

  return (
    <div className="ky-root">

      {/* header */}
      <div className="ky-page-head">
        <div className="ky-ph-left">
          <div className="ky-ph-ico"><IdentificationCard size={16} weight="fill"/></div>
          <div>
            <h1 className="ky-page-title">KYC Verification</h1>
            <p className="ky-page-sub">Identity verification unlocks higher limits and full platform access</p>
          </div>
        </div>
        <nav className="ky-bc"><span>Settings</span><CaretRight size={9}/><span className="cur">KYC</span></nav>
      </div>

      {/* Tier cards */}
      <div className="ky-section">
        <div className="ky-sec-title">Verification tiers</div>
        <div className="ky-sec-body">
          <div className="ky-tiers">
            {TIERS.map((t, i) => {
              const isOk   = t.status === 'verified'
              const isOpen = active === t.id
              return (
                <button key={t.id} className={`ky-tier ${isOpen?'open':''} ky-tier-${t.status}`}
                  style={{'--tc':t.color}} onClick={() => setActive(t.id)}>
                  <div className="ky-tier-hd">
                    <div className="ky-tier-num" style={isOk ? {background:t.color,borderColor:t.color,color:'#000'} : {}}>
                      {isOk ? <Check size={10} weight="bold"/> : t.id}
                    </div>
                    <div className="ky-tier-meta">
                      <span className="ky-tier-lbl">{t.label}</span>
                      <span className="ky-tier-name">{t.name}</span>
                    </div>
                    <div className={`ky-tier-badge ky-tbadge-${t.status}`}>
                      {t.status==='verified' ? <><SealCheck size={9} weight="fill"/>Verified</> :
                       t.status==='pending'  ? <><Hourglass size={9} weight="fill"/>Pending</>  :
                                               <><LockOpen size={9} weight="duotone"/>Locked</>}
                    </div>
                    <CaretRight size={11} className={`ky-tier-caret ${isOpen?'open':''}`}/>
                  </div>

                  {isOpen && (
                    <div className="ky-tier-body">
                      <div className="ky-tier-col">
                        <div className="ky-tier-col-hd">
                          <Sparkle size={9} weight="fill" style={{color:t.color}}/>Unlocks
                        </div>
                        {t.limits.map((lm,j) => (
                          <div key={j} className="ky-tier-item" style={{'--tc':t.color}}>
                            <Check size={8} weight="bold"/>{lm}
                          </div>
                        ))}
                      </div>
                      <div className="ky-tier-col">
                        <div className="ky-tier-col-hd">
                          <IdentificationCard size={9} weight="fill" style={{color:'#9945FF'}}/>Required
                        </div>
                        {t.req.map((rq,j) => (
                          <div key={j} className="ky-tier-item" style={{'--tc':'#9945FF'}}>
                            <ArrowRight size={8} weight="bold"/>{rq}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {i < TIERS.length - 1 && (
                    <div className={`ky-tier-conn ${isOk?'done':''}`}/>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tier 3 upload zone */}
      {active === 3 && (
        <div className="ky-section">
          <div className="ky-sec-title">Tier 3 — Document submission</div>
          <div className="ky-sec-body">
            {phase === 'upload' ? (
              <>
                <div className="ky-req-box">
                  <Info size={11} weight="fill" style={{color:'#1A56FF',flexShrink:0}}/>
                  <span>Upload all 5 documents clearly. All four corners must be visible. Blurry or cropped images will be rejected.</span>
                </div>
                <div className="ky-doc-grid">
                  {DOC_SLOTS.map(s => (
                    <DocSlot key={s.id} slot={s} file={docs[s.id]||null} onFile={handleFile}/>
                  ))}
                </div>
                <div className="ky-submit-row">
                  <button className="ky-primary-btn" disabled={!allDocs || busy} onClick={submit}>
                    {busy
                      ? <><span className="ky-spin"/>Submitting…</>
                      : <><SealCheck size={13} weight="bold"/>Submit for verification</>
                    }
                  </button>
                  <button className="ky-outline-btn" onClick={() => setPhase('view')}>Back</button>
                  <span className="ky-doc-count">
                    {DOC_SLOTS.filter(s => docs[s.id]).length}/{DOC_SLOTS.length} uploaded
                  </span>
                </div>
              </>
            ) : (
              <div className="ky-cta">
                <div className="ky-cta-ico"><Certificate size={28} weight="duotone" style={{color:'#00FFD1'}}/></div>
                <div>
                  <div className="ky-cta-title">Apply for Tier 3 · Institutional</div>
                  <div className="ky-cta-sub">Unlock unlimited trading, a dedicated account manager, and custom fee rates.</div>
                </div>
                <button className="ky-primary-btn" onClick={() => setPhase('upload')}>
                  Start application <ArrowRight size={12} weight="bold"/>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verified tier status */}
      {active <= 2 && (
        <div className="ky-section">
          <div className="ky-sec-title">Tier {active} — Status</div>
          <div className="ky-sec-body">
            <div className="ky-verified-banner">
              <CheckCircle size={20} weight="fill" style={{color:'#00C076',flexShrink:0}}/>
              <div>
                <div className="ky-vb-title">{TIERS[active-1].name} verification complete</div>
                <div className="ky-vb-sub">
                  {active < 3
                    ? 'Apply for Tier 3 to unlock institutional-grade access and trading limits.'
                    : 'Maximum verification tier achieved.'}
                </div>
              </div>
              {active < 3 && (
                <button className="ky-primary-btn" onClick={() => setActive(3)}>
                  Upgrade to Tier 3 <ArrowRight size={12} weight="bold"/>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}