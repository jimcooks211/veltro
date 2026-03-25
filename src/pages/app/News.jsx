import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useOutletContext } from 'react-router-dom'
import {
  CaretRight, MagnifyingGlass, BookmarkSimple,
  ArrowUpRight, ArrowDownRight, Clock, TrendUp, TrendDown,
  ArrowSquareOut, X, Lightning, Globe, Cpu,
  CurrencyBtc, ChartLine, Buildings, Fire,
  Newspaper, RadioButton,
} from '@phosphor-icons/react'
import './News.css'

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
const CATEGORIES = ['All', 'Markets', 'Crypto', 'Macro', 'Earnings', 'Technology', 'Energy', 'M&A']
const CAT_ICONS  = {
  Markets: ChartLine, Crypto: CurrencyBtc, Macro: Globe,
  Earnings: Buildings, Technology: Cpu, Energy: Lightning,
  'M&A': ArrowSquareOut, All: Newspaper,
}
const SOURCES = {
  'Bloomberg':       { color: '#FF6B00' },
  'Reuters':         { color: '#E85C2C' },
  'Financial Times': { color: '#FCC44A' },
  'WSJ':             { color: '#004BFF' },
  'CNBC':            { color: '#0072CE' },
  'CoinDesk':        { color: '#1652F0' },
  'The Block':       { color: '#00D4FF' },
  'Axios Markets':   { color: '#FF4136' },
  "Barron's":        { color: '#C9A84C' },
}
const NEWS_DATA = [
  { id:1,  cat:'Earnings',   source:'Bloomberg',       readMin:4, isBreaking:true,  isFeatured:true,
    headline:'NVIDIA Beats Estimates by 18% as AI Chip Demand Defies Gravity for Fifth Consecutive Quarter',
    summary:'NVIDIA reported quarterly revenue of $35.1 billion, surpassing Wall Street expectations by a significant margin as data center revenue hit a record $30.8 billion. CEO Jensen Huang cited "extraordinary" demand from hyperscalers and sovereign AI programs across 65 nations.',
    sentiment:'bullish', impact:94,
    assets:[{sym:'NVDA',pct:+8.4},{sym:'AMD',pct:+2.1},{sym:'INTC',pct:-1.8}],
    tags:['AI','Semiconductors','Earnings Beat'], postedMinsAgo:12 },
  { id:2,  cat:'Crypto',     source:'CoinDesk',        readMin:3, isBreaking:true,  isFeatured:false,
    headline:'Bitcoin Surges Past $70K After Federal Reserve Signals Pause in Rate Hike Cycle',
    summary:"Bitcoin climbed to a six-month high following Fed Chair Powell's remarks suggesting the central bank may hold rates steady, boosting risk appetite across digital asset markets.",
    sentiment:'bullish', impact:88,
    assets:[{sym:'BTC',pct:+6.2},{sym:'ETH',pct:+4.8},{sym:'SOL',pct:+9.1}],
    tags:['Bitcoin','Federal Reserve','Monetary Policy'], postedMinsAgo:28 },
  { id:3,  cat:'Macro',      source:'Reuters',         readMin:5, isBreaking:false, isFeatured:false,
    headline:'US Consumer Price Index Cools to 2.8% in February, Lowest Reading Since March 2021',
    summary:'Inflation data came in below economist forecasts for the second consecutive month, reigniting bets on Federal Reserve rate cuts as early as June. Core CPI ex-food and energy also decelerated to 3.1% year-over-year.',
    sentiment:'bullish', impact:82,
    assets:[{sym:'SPY',pct:+1.4},{sym:'TLT',pct:+2.1},{sym:'GLD',pct:+0.8}],
    tags:['Inflation','CPI','Fed Policy'], postedMinsAgo:45 },
  { id:4,  cat:'Technology', source:'Financial Times', readMin:6, isBreaking:false, isFeatured:false,
    headline:'Apple Vision Pro Quietly Discontinued After 14 Months as Company Pivots to Thinner AR Glasses Form Factor',
    summary:"Apple has ceased production of the Vision Pro headset, redirecting its spatial computing division toward a lighter, more affordable pair of AR glasses expected to launch in 2026. The move signals a strategic reset for the company's ambitions in mixed reality.",
    sentiment:'bearish', impact:71,
    assets:[{sym:'AAPL',pct:-2.3},{sym:'META',pct:+1.1}],
    tags:['Apple','AR/VR','Hardware'], postedMinsAgo:67 },
  { id:5,  cat:'M&A',        source:'WSJ',             readMin:4, isBreaking:true,  isFeatured:false,
    headline:'Alphabet in Advanced Talks to Acquire Cybersecurity Firm Wiz for $23 Billion',
    summary:"Google's parent company has resumed acquisition discussions with Wiz after initial talks collapsed last year. A deal would represent one of the largest cybersecurity acquisitions in history and strengthen Google Cloud's enterprise security portfolio.",
    sentiment:'bullish', impact:79,
    assets:[{sym:'GOOGL',pct:-0.8},{sym:'MSFT',pct:+0.4},{sym:'AMZN',pct:+0.2}],
    tags:['M&A','Cybersecurity','Cloud'], postedMinsAgo:89 },
  { id:6,  cat:'Markets',    source:'CNBC',            readMin:3, isBreaking:false, isFeatured:false,
    headline:'S&P 500 Notches Eighth Consecutive Week of Gains as Breadth Widens Beyond Magnificent Seven',
    summary:'The benchmark index rose for an eighth straight week, its longest winning streak since 2017, as small-cap stocks joined the rally and sector participation broadened significantly.',
    sentiment:'bullish', impact:68,
    assets:[{sym:'SPY',pct:+1.2},{sym:'IWM',pct:+2.8},{sym:'QQQ',pct:+0.9}],
    tags:['S&P 500','Bull Market','Market Breadth'], postedMinsAgo:112 },
  { id:7,  cat:'Energy',     source:'Reuters',         readMin:4, isBreaking:false, isFeatured:false,
    headline:'OPEC+ Extends Production Cuts Through Q3 as Oil Demand Outlook Dims on China Slowdown',
    summary:'The cartel agreed to maintain voluntary output reductions of 2.2 million barrels per day through September, citing weaker-than-expected demand from China and elevated inventories in OECD nations.',
    sentiment:'neutral', impact:61,
    assets:[{sym:'XOM',pct:+1.6},{sym:'CVX',pct:+1.2}],
    tags:['OPEC','Oil','Commodities'], postedMinsAgo:134 },
  { id:8,  cat:'Crypto',     source:'The Block',       readMin:3, isBreaking:false, isFeatured:false,
    headline:'Ethereum ETF Sees Record $840M Single-Day Inflow as Institutional Demand Accelerates',
    summary:"Spot Ethereum ETFs attracted the largest single-day net inflow since their July 2024 launch, driven primarily by BlackRock's ETHA and Fidelity's FETH funds, signaling a structural shift in institutional crypto allocation.",
    sentiment:'bullish', impact:77,
    assets:[{sym:'ETH',pct:+5.3},{sym:'BTC',pct:+1.8}],
    tags:['Ethereum','ETF','Institutional'], postedMinsAgo:156 },
  { id:9,  cat:'Earnings',   source:"Barron's",        readMin:5, isBreaking:false, isFeatured:false,
    headline:'Tesla Misses Revenue Estimates for Third Straight Quarter as EV Price War Erodes Margins',
    summary:'Tesla reported revenue of $21.3 billion versus the $22.1 billion consensus estimate as aggressive pricing in China and a product transition period weighed on the top line. Vehicle deliveries of 386,000 also fell short of analyst forecasts.',
    sentiment:'bearish', impact:85,
    assets:[{sym:'TSLA',pct:-7.2},{sym:'RIVN',pct:-2.1},{sym:'GM',pct:+0.6}],
    tags:['Tesla','EV','Earnings Miss'], postedMinsAgo:178 },
  { id:10, cat:'Macro',      source:'Financial Times', readMin:7, isBreaking:false, isFeatured:false,
    headline:'ECB Cuts Rates for Third Time This Cycle as Eurozone Growth Stalls in Q4 2025',
    summary:'The European Central Bank reduced its benchmark rate by 25 basis points to 2.75%, citing below-target inflation and economic stagnation across Germany and France. President Lagarde signaled further cuts remain data-dependent.',
    sentiment:'neutral', impact:72,
    assets:[{sym:'EUR/USD',pct:-0.4},{sym:'GLD',pct:+0.6}],
    tags:['ECB','Interest Rates','Europe'], postedMinsAgo:210 },
  { id:11, cat:'Technology', source:'Bloomberg',       readMin:5, isBreaking:false, isFeatured:false,
    headline:'OpenAI Closes $6.5 Billion Series E at $157 Billion Valuation, Largest Private Funding Round in History',
    summary:'The AI research company secured investments from SoftBank, Microsoft, and a consortium of sovereign wealth funds. The capital will fund compute infrastructure expansion and accelerate GPT-5 development timelines.',
    sentiment:'bullish', impact:76,
    assets:[{sym:'MSFT',pct:+2.4},{sym:'NVDA',pct:+1.8}],
    tags:['OpenAI','AI','Private Markets'], postedMinsAgo:245 },
  { id:12, cat:'Markets',    source:'Axios Markets',   readMin:2, isBreaking:false, isFeatured:false,
    headline:'VIX Drops Below 13 for First Time Since 2019 as Options Market Prices In Extended Calm',
    summary:'The CBOE Volatility Index closed at 12.8, its lowest reading in six years, as dealers heavily short gamma suppress realized volatility and equity markets grind higher on thin but persistent institutional buying.',
    sentiment:'bullish', impact:58,
    assets:[{sym:'SPY',pct:+0.6},{sym:'QQQ',pct:+0.8}],
    tags:['VIX','Volatility','Options'], postedMinsAgo:290 },
]
const TICKER_ITEMS = [
  'NVDA +8.4%','BTC $70,240','S&P 5,842','ETH +4.8%','TSLA -7.2%',
  'CPI 2.8% YoY','Fed Funds 5.25%','AAPL -2.3%','GOOGL M&A talks','VIX 12.8',
  'EUR/USD 1.0842','Gold $2,180','Oil $78.40','MSFT +2.4%','SOL +9.1%',
]
const TRENDING = [
  { tag:'AI Earnings',  count:42, hot:true  },
  { tag:'Rate Cuts',    count:38, hot:true  },
  { tag:'Bitcoin ETF',  count:31, hot:false },
  { tag:'NVDA Results', count:28, hot:false },
  { tag:'OPEC Meeting', count:19, hot:false },
  { tag:'ECB Policy',   count:17, hot:false },
  { tag:'Apple AR',     count:14, hot:false },
]
const TC = {
  NVDA:'#00C076',BTC:'#F7931A',ETH:'#627EEA',SOL:'#9945FF',
  AAPL:'#1A56FF',MSFT:'#00D4FF',GOOGL:'#FFB800',META:'#1A56FF',
  TSLA:'#FF3D57',SPY:'#1A56FF',QQQ:'#00D4FF',IWM:'#C9A84C',
  TLT:'#A855F7',GLD:'#FFD700',XOM:'#FF8C42',CVX:'#FF8C42',
  'EUR/USD':'#1A56FF',
}
const fmtAgo = m => m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m/60)}h ago` : `${Math.floor(m/1440)}d ago`

/* ── BookmarkSimple weight='fill' is the correct Phosphor API ── */
const BmIcon = ({ size, filled }) => <BookmarkSimple size={size} weight={filled ? 'fill' : 'duotone'} />

/* ═══════════════════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════════════════ */
function BreakingTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className='nw-ticker'>
      <div className='nw-ticker-label'>
        <RadioButton size={10} weight='fill' className='nw-ticker-dot'/>
        <span>LIVE</span>
      </div>
      <div className='nw-ticker-track'>
        <div className='nw-ticker-inner'>
          {items.map((item,i) => (
            <span key={i} className='nw-ticker-item'>{item}<span className='nw-ticker-sep'>·</span></span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SentimentBadge({ sentiment, size='md' }) {
  const cfg = {
    bullish:{ label:'Bullish', Icon:TrendUp,   col:'#00C076', bg:'rgba(0,192,118,0.1)',   border:'rgba(0,192,118,0.22)' },
    bearish:{ label:'Bearish', Icon:TrendDown, col:'#FF3D57', bg:'rgba(255,61,87,0.1)',   border:'rgba(255,61,87,0.22)'  },
    neutral:{ label:'Neutral', Icon:ChartLine, col:'#8A96B4', bg:'rgba(138,150,180,0.1)', border:'rgba(138,150,180,0.2)' },
  }[sentiment]
  const { label, Icon, col, bg, border } = cfg
  return (
    <span className={`nw-sentiment nw-sentiment-${size}`} style={{ color:col, background:bg, borderColor:border }}>
      <Icon size={size==='lg'?12:10} weight='bold'/>{label}
    </span>
  )
}

function ImpactMeter({ score }) {
  const col = score>=80 ? '#FF3D57' : score>=60 ? '#FFB800' : '#8A96B4'
  return (
    <div className='nw-impact'>
      <span className='nw-impact-label'>Impact</span>
      <div className='nw-impact-bar'>
        <div className='nw-impact-fill' style={{ width:`${score}%`, background:col, boxShadow:`0 0 8px ${col}60` }}/>
      </div>
      <span className='nw-impact-val' style={{ color:col }}>{score}</span>
    </div>
  )
}

function AssetChips({ assets }) {
  return (
    <div className='nw-assets'>
      {assets.map(a => {
        const up = a.pct>=0; const col = TC[a.sym]||'#8A96B4'
        return (
          <span key={a.sym} className='nw-asset-chip'>
            <span className='nw-ac-dot' style={{ background:col }}/>
            <span className='nw-ac-sym'>{a.sym}</span>
            <span className={`nw-ac-pct ${up?'up':'dn'}`}>
              {up?<ArrowUpRight size={8} weight='bold'/>:<ArrowDownRight size={8} weight='bold'/>}
              {Math.abs(a.pct).toFixed(1)}%
            </span>
          </span>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   HERO CARD
═══════════════════════════════════════════════════════════════ */
function HeroCard({ article, bookmarked, onBookmark, onRead }) {
  const src = SOURCES[article.source]
  return (
    <div className='nw-hero' onClick={() => onRead(article)}>
      <div className='nw-hero-bg'><div className='nw-hero-grid'/><div className='nw-hero-glow'/></div>
      <div className='nw-hero-body'>
        <div className='nw-hero-left'>
          <div className='nw-hero-meta'>
            {article.isBreaking && (
              <span className='nw-breaking'><RadioButton size={8} weight='fill' className='nw-break-dot'/>BREAKING</span>
            )}
            <span className='nw-hero-cat'>{article.cat}</span>
            <span className='nw-hero-source' style={{ color:src?.color }}>{article.source}</span>
            <span className='nw-hero-ago'><Clock size={10} weight='duotone'/>{fmtAgo(article.postedMinsAgo)}</span>
          </div>
          <h2 className='nw-hero-headline'>{article.headline}</h2>
          <p className='nw-hero-summary'>{article.summary}</p>
          <div className='nw-hero-foot'>
            <SentimentBadge sentiment={article.sentiment} size='lg'/>
            <ImpactMeter score={article.impact}/>
            <div className='nw-hero-read'><Clock size={11} weight='duotone'/>{article.readMin} min read</div>
          </div>
          <AssetChips assets={article.assets}/>
        </div>
        <div className='nw-hero-right'>
          <button className={`nw-bm-btn${bookmarked?' on':''}`} onClick={e=>{e.stopPropagation();onBookmark(article.id)}}>
            <BmIcon size={16} filled={bookmarked}/>
          </button>
          <div className='nw-hero-tags'>{article.tags.map(t=><span key={t} className='nw-tag'>{t}</span>)}</div>
          <button className='nw-hero-cta' onClick={e=>{e.stopPropagation();onRead(article)}}>
            Read Full Story<ArrowSquareOut size={12} weight='bold'/>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   NEWS CARD
═══════════════════════════════════════════════════════════════ */
function NewsCard({ article, bookmarked, onBookmark, onRead, delay=0 }) {
  const src = SOURCES[article.source]; const isNew = article.postedMinsAgo<=30
  return (
    <div className='nw-card' style={{ animationDelay:`${delay}ms` }} onClick={()=>onRead(article)}>
      <div className='nw-card-left'>
        <div className='nw-card-meta'>
          {isNew && <span className='nw-new-badge'>NEW</span>}
          {article.isBreaking && !isNew && <span className='nw-break-badge'><RadioButton size={7} weight='fill'/>BREAKING</span>}
          <span className='nw-card-cat'>{article.cat}</span>
          <span className='nw-card-src' style={{ color:src?.color }}>{article.source}</span>
          <span className='nw-card-ago'><Clock size={9} weight='duotone'/>{fmtAgo(article.postedMinsAgo)}</span>
        </div>
        <h3 className='nw-card-headline'>{article.headline}</h3>
        <p className='nw-card-summary'>{article.summary}</p>
        <div className='nw-card-foot'>
          <SentimentBadge sentiment={article.sentiment} size='sm'/>
          <ImpactMeter score={article.impact}/>
          <span className='nw-card-read'><Clock size={10} weight='duotone'/>{article.readMin} min</span>
          <AssetChips assets={article.assets.slice(0,3)}/>
        </div>
      </div>
      <div className='nw-card-right'>
        <button className={`nw-bm-btn sm${bookmarked?' on':''}`} onClick={e=>{e.stopPropagation();onBookmark(article.id)}}>
          <BmIcon size={13} filled={bookmarked}/>
        </button>
        <div className='nw-card-tags'>{article.tags.slice(0,2).map(t=><span key={t} className='nw-tag sm'>{t}</span>)}</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ARTICLE READER OVERLAY
═══════════════════════════════════════════════════════════════ */
function ArticleReader({ article, bookmarked, onBookmark, onClose }) {
  const src = SOURCES[article.source]
  useEffect(()=>{
    const fn = e=>{ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',fn); return ()=>window.removeEventListener('keydown',fn)
  },[onClose])
  return (
    <div className='nw-reader-overlay' onClick={onClose}>
      <div className='nw-reader' onClick={e=>e.stopPropagation()}>
        <div className='nw-reader-top'>
          <div className='nw-reader-meta'>
            {article.isBreaking && <span className='nw-breaking'>BREAKING</span>}
            <span className='nw-reader-cat'>{article.cat}</span>
            <span className='nw-reader-src' style={{ color:src?.color }}>{article.source}</span>
            <span className='nw-card-ago'><Clock size={10} weight='duotone'/>{fmtAgo(article.postedMinsAgo)}</span>
          </div>
          <div className='nw-reader-actions'>
            <button className={`nw-bm-btn${bookmarked?' on':''}`} onClick={()=>onBookmark(article.id)}>
              <BmIcon size={15} filled={bookmarked}/>
            </button>
            <button className='nw-reader-close' onClick={onClose}><X size={15} weight='bold'/></button>
          </div>
        </div>
        <div className='nw-reader-scroll'>
          <h2 className='nw-reader-headline'>{article.headline}</h2>
          <div className='nw-reader-badges'>
            <SentimentBadge sentiment={article.sentiment} size='lg'/>
            <ImpactMeter score={article.impact}/>
            <span className='nw-card-read'><Clock size={10} weight='duotone'/>{article.readMin} min read</span>
          </div>
          <div className='nw-reader-chips'><AssetChips assets={article.assets}/></div>
          <div className='nw-reader-divider'/>
          <p className='nw-reader-body'>{article.summary}</p>
          <p className='nw-reader-body'>Market participants are closely watching the implications of this development as analysts revise their models and institutional positioning shifts in response. The broader macroeconomic environment continues to influence risk appetite, with central bank policy remaining the dominant near-term catalyst.</p>
          <p className='nw-reader-body'>Sector rotation patterns suggest capital is flowing toward quality growth names with strong free cash flow generation, while speculative positions are being unwound in areas of the market perceived as overextended on a valuation basis.</p>
          <div className='nw-reader-divider'/>
          <div className='nw-reader-tags'>{article.tags.map(t=><span key={t} className='nw-tag'>{t}</span>)}</div>
          <a href='#' className='nw-reader-ext' onClick={e=>e.preventDefault()}>
            Read full article on {article.source}<ArrowSquareOut size={12} weight='bold'/>
          </a>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════ */
function NewsSidebar({ articles, bookmarks, onRead }) {
  const counts  = articles.reduce((a,x)=>{ a[x.sentiment]=(a[x.sentiment]||0)+1; return a },{})
  const total   = articles.length
  const bullPct = Math.round(((counts.bullish||0)/total)*100)
  const bearPct = Math.round(((counts.bearish||0)/total)*100)
  const neuPct  = 100-bullPct-bearPct
  const mostRead = [...articles].sort((a,b)=>b.impact-a.impact).slice(0,5)
  return (
    <aside className='nw-sidebar'>
      <div className='nw-side-panel'>
        <div className='nw-side-head'><ChartLine size={12} weight='duotone' className='nw-side-ico'/><span>Market Sentiment</span></div>
        <div className='nw-sent-body'>
          <div className='nw-sent-bar'>
            <div className='nw-sent-bull' style={{ width:`${bullPct}%` }}/>
            <div className='nw-sent-neu'  style={{ width:`${neuPct}%`  }}/>
            <div className='nw-sent-bear' style={{ width:`${bearPct}%` }}/>
          </div>
          <div className='nw-sent-legend'>
            <span className='nw-sl-item bull'><i/>Bullish {bullPct}%</span>
            <span className='nw-sl-item neu'><i/>Neutral {neuPct}%</span>
            <span className='nw-sl-item bear'><i/>Bearish {bearPct}%</span>
          </div>
          <div className='nw-sent-score'>
            <span className='nw-ss-label'>Fear &amp; Greed</span>
            <span className='nw-ss-val' style={{ color:bullPct>60?'#00C076':bullPct<40?'#FF3D57':'#FFB800' }}>
              {bullPct>60?'GREED':bullPct<40?'FEAR':'NEUTRAL'}
            </span>
          </div>
        </div>
      </div>
      <div className='nw-side-panel'>
        <div className='nw-side-head'><Fire size={12} weight='duotone' style={{ color:'#FF6B42' }}/><span>Trending Topics</span></div>
        <div className='nw-trending'>
          {TRENDING.map((t,i)=>(
            <div key={t.tag} className='nw-trend-row'>
              <span className='nw-trend-rank'>{i+1}</span>
              <span className='nw-trend-tag'>{t.tag}</span>
              {t.hot && <Fire size={10} weight='fill' style={{ color:'#FF6B42',flexShrink:0 }}/>}
              <span className='nw-trend-count'>{t.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className='nw-side-panel'>
        <div className='nw-side-head'><Lightning size={12} weight='duotone' className='nw-side-ico'/><span>Most Impactful</span></div>
        <div className='nw-mostread'>
          {mostRead.map((a,i)=>(
            <div key={a.id} className='nw-mr-row' onClick={()=>onRead(a)}>
              <span className='nw-mr-rank'>{i+1}</span>
              <div className='nw-mr-info'>
                <span className='nw-mr-headline'>{a.headline}</span>
                <div className='nw-mr-meta'><span className='nw-mr-src'>{a.source}</span><SentimentBadge sentiment={a.sentiment} size='xs'/></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {bookmarks.size>0 && (
        <div className='nw-side-panel nw-bm-panel'>
          <div className='nw-side-head'>
            <BookmarkSimple size={12} weight='fill' style={{ color:'#FFB800' }}/>
            <span>Saved Stories</span>
            <span className='nw-bm-count'>{bookmarks.size}</span>
          </div>
        </div>
      )}
    </aside>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function News() {
  const { user, isDark } = useOutletContext() ?? {}
  const [cat,        setCat]        = useState('All')
  const [search,     setSearch]     = useState('')
  const [bookmarks,  setBookmarks]  = useState(new Set([1]))
  const [reading,    setReading]    = useState(null)
  const [time,       setTime]       = useState(()=>new Date())
  const [showBmOnly, setShowBmOnly] = useState(false)

  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(t) },[])

  const toggleBookmark = useCallback(id=>{
    setBookmarks(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
  },[])

  const filtered = NEWS_DATA.filter(a=>{
    if (showBmOnly && !bookmarks.has(a.id)) return false
    if (cat!=='All' && a.cat!==cat) return false
    if (search) { const q=search.toLowerCase(); return a.headline.toLowerCase().includes(q)||a.summary.toLowerCase().includes(q)||a.assets.some(x=>x.sym.toLowerCase().includes(q))||a.tags.some(t=>t.toLowerCase().includes(q)) }
    return true
  })
  const featured     = filtered.find(a=>a.isFeatured)??filtered[0]
  const feedArticles = filtered.filter(a=>a.id!==featured?.id)

  return (
    <div className='nw-root'>
      <BreakingTicker/>
      <div className='nw-top'>
        <div>
          <h1 className='nw-title'>Market News</h1>
          <div className='nw-meta'>
            <span className='nw-time'><Clock size={10} weight='duotone'/>{time.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})} EST</span>
            <span className='nw-divider'/>
            <span className='nw-count'>{NEWS_DATA.length} stories today</span>
            <span className='nw-divider'/>
            <span className='nw-breaking-count'><RadioButton size={9} weight='fill' style={{ color:'#FF3D57' }}/>{NEWS_DATA.filter(a=>a.isBreaking).length} breaking</span>
          </div>
        </div>
        <nav className='nw-bc'><span>Veltro</span><CaretRight size={9}/><span>Dashboards</span><CaretRight size={9}/><span className='act'>News</span></nav>
      </div>
      <div className='nw-controls'>
        <div className='nw-cat-tabs'>
          {CATEGORIES.map(c=>{ const Icon=CAT_ICONS[c]||Newspaper; const count=c==='All'?NEWS_DATA.length:NEWS_DATA.filter(a=>a.cat===c).length
            return <button key={c} className={`nw-cat-tab${cat===c?' on':''}`} onClick={()=>setCat(c)}><Icon size={11} weight='duotone'/>{c}<span className='nw-cat-count'>{count}</span></button>
          })}
        </div>
        <div className='nw-controls-row2'>
          <div className='nw-search-wrap'>
            <MagnifyingGlass size={13} className='nw-search-ico' weight='bold'/>
            <input className='nw-search' placeholder='Search news, tickers, topics...' value={search} onChange={e=>setSearch(e.target.value)}/>
            {search && <button className='nw-search-clear' onClick={()=>setSearch('')}><X size={11} weight='bold'/></button>}
          </div>
          <button className={`nw-bm-filter${showBmOnly?' on':''}`} onClick={()=>setShowBmOnly(p=>!p)}>
            <BmIcon size={13} filled={showBmOnly}/>Saved{bookmarks.size>0&&<span className='nw-bm-badge'>{bookmarks.size}</span>}
          </button>
        </div>
      </div>
      <div className='nw-body'>
        <div className='nw-main'>
          {featured && <HeroCard article={featured} bookmarked={bookmarks.has(featured.id)} onBookmark={toggleBookmark} onRead={setReading}/>}
          <div className='nw-feed'>
            {feedArticles.length===0 && (
              <div className='nw-empty'>
                <Newspaper size={28} weight='duotone' style={{ opacity:0.2 }}/>
                <p>No stories match your filters.</p>
                <button className='nw-empty-reset' onClick={()=>{setSearch('');setCat('All');setShowBmOnly(false)}}>Clear filters</button>
              </div>
            )}
            {feedArticles.map((a,i)=><NewsCard key={a.id} article={a} bookmarked={bookmarks.has(a.id)} onBookmark={toggleBookmark} onRead={setReading} delay={i*35}/>)}
          </div>
        </div>
        <NewsSidebar articles={NEWS_DATA} bookmarks={bookmarks} onRead={setReading}/>
      </div>
      {reading && createPortal(
        <div className={isDark===false ? 'light' : ''} style={{display:'contents'}}>
          <ArticleReader article={reading} bookmarked={bookmarks.has(reading.id)} onBookmark={toggleBookmark} onClose={()=>setReading(null)}/>
        </div>,
        document.body
      )}
    </div>
  )
}