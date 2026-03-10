import React, { useState, useEffect } from 'react'
import { useInView } from '../../hooks/useInView'
import './public.css'
import { Brain, ChartLineUp, LockKey, Crosshair } from '@phosphor-icons/react'

const MARQUEE_ITEMS = [
  { ticker: 'AAPL',  name: 'Apple Inc.',         price: '$189.43', change: '+1.2%', up: true,  logo: 'https://www.google.com/s2/favicons?domain=apple.com&sz=64'             },
  { ticker: 'TSLA',  name: 'Tesla Inc.',          price: '$242.10', change: '-0.8%', up: false, logo: 'https://www.google.com/s2/favicons?domain=tesla.com&sz=64'             },
  { ticker: 'AMZN',  name: 'Amazon.com Inc.',     price: '$178.25', change: '+2.4%', up: true,  logo: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=64'            },
  { ticker: 'NVDA',  name: 'NVIDIA Corp.',        price: '$875.40', change: '+3.1%', up: true,  logo: 'https://www.google.com/s2/favicons?domain=nvidia.com&sz=64'            },
  { ticker: 'MSFT',  name: 'Microsoft Corp.',     price: '$415.20', change: '+0.6%', up: true,  logo: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=64'         },
  { ticker: 'GOOGL', name: 'Alphabet Inc.',       price: '$163.90', change: '-0.3%', up: false, logo: 'https://www.google.com/s2/favicons?domain=google.com&sz=64'            },
  { ticker: 'META',  name: 'Meta Platforms',      price: '$505.60', change: '+1.8%', up: true,  logo: 'https://www.google.com/s2/favicons?domain=meta.com&sz=64'              },
  { ticker: 'JPM',   name: 'JPMorgan Chase',      price: '$198.70', change: '-0.5%', up: false, logo: 'https://www.google.com/s2/favicons?domain=jpmorgan.com&sz=64'          },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway',  price: '$368.90', change: '+0.4%', up: true,  logo: 'https://www.google.com/s2/favicons?domain=berkshirehathaway.com&sz=64' },
  { ticker: 'GS',    name: 'Goldman Sachs',       price: '$452.30', change: '+1.1%', up: true,  logo: 'https://www.google.com/s2/favicons?domain=goldmansachs.com&sz=64'      },
]

export default function About() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // 'hidden' → 'animating' → 'live'
  const [phase, setPhase] = useState('hidden')

  const [marqueeRef, marqueeInView, marqueeExitTop] = useInView()
  const [textRef,           textInView]           = useInView()
  const [tagsRef,           tagsInView]           = useInView()
  const [accomplishmentsRef, accomplishmentsInView] = useInView()

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('animating'), 2000)
    const t2 = setTimeout(() => setPhase('live'), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // animating = always show, live = inView controls it
  const isVisible = (inView) =>
    phase === 'animating' || (phase === 'live' && inView)

  return (
    <div className={`${!isDark ? "landpage-color-adapt" : "landpage-move-down"}`}>

      {/* marquee */}
      <div ref={marqueeRef} className={`reveal ${marqueeInView ? 'visible' : ''} ${marqueeExitTop ? 'exit-top' : ''}`}>
        <div
          className="marquee-landpage"
          style={{
            background:   isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.02)',
            borderTop:    isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <div className="marquee-track">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <div className="marquee-item" key={i}>
                <img
                  src={item.logo}
                  alt={item.name}
                  className="marquee-logo"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <span className="marquee-ticker" style={{ color: isDark ? 'var(--veltro-white)' : 'var(--veltro-navy)' }}>{item.ticker}</span>
                <span className="marquee-name">{item.name}</span>
                <span className="marquee-price" style={{ color: isDark ? 'var(--veltro-white)' : 'var(--veltro-navy)' }}>{item.price}</span>
                <span className={`marquee-change ${item.up ? 'up' : 'down'}`}>
                  {item.up ? '▲' : '▼'} {item.change}
                </span>
                <span className="marquee-dot">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* core statement — phase controls initial load, inView controls scroll */}
      <p
        ref={textRef}
        className={`crafting-exceptional-p reveal ${isVisible(textInView) ? 'visible' : ''}`}
      >
        Institutional grade intelligence, precision built tools, and battle tested strategies. Finally available to every investor who refuses to settle for average returns.
      </p>

      {/* four identity tags */}
      <div
        ref={tagsRef}
        className={`about-tag-list reveal-children ${tagsInView ? 'visible' : ''}`}
      >
        <div className='about-tag about-tag1'>
          <Brain />
          <p>Intelligence</p>
        </div>
        <div className='about-tag about-tag2'>
          <Crosshair />
          <p>Precision</p>
        </div>
        <div className='about-tag about-tag3'>
          <ChartLineUp />
          <p>Growth</p>
        </div>
        <div className='about-tag about-tag3'>
          <LockKey />
          <p>Security</p>
        </div>
      </div>

      {/* proof numbers */}
      <div
        ref={accomplishmentsRef}
        className={`about-accomplishments reveal-children ${accomplishmentsInView ? 'visible' : ''}`}
      >
        <div className='about-accomplised'>
          <p><span>$</span>2.4B</p>
          <p>Assets Under Management</p>
        </div>
        <div className='about-accomplised'>
          <p><span>+</span>1000</p>
          <p>Active Investors Worldwide</p>
        </div>
        <div className='about-accomplised'>
          <p><span>+</span>94%</p>
          <p>Client Portfolio Growth Rate</p>
        </div>
      </div>

    </div>
  )
}