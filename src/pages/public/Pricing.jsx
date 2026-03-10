import { ArrowRight, CheckIcon } from '@phosphor-icons/react'
import React, { useState } from 'react'
import { useInView } from '../../hooks/useInView'
import './public.css'

export default function Pricing() {
  const [titleRef, titleInView] = useInView()
  const [cardsRef, cardsInView] = useInView()
  const [leaving, setLeaving]   = useState(false)

  const handleRedirect = (path) => {
    setLeaving(true)
    setTimeout(() => window.location.href = path, 500)
  }

  return (
    <div className={leaving ? 'page-exit' : ''}>

      <p
        ref={titleRef}
        className={`pick-plan-title reveal ${titleInView ? 'visible' : ''}`}
      >
        One payment. A lifetime of smarter investing.
      </p>

      <div
        ref={cardsRef}
        className={`pricing-card-container reveal-children ${cardsInView ? 'visible' : ''}`}
      >

        {/* essential */}
        <div className='pricing-card-landpage'>
          <div className='pricing-card-l'>
            <p>Essential</p>
            <p>Everything you need to start investing with intelligence and confidence. No monthly fees, ever.</p>
            <p>$149<span>/one-time</span></p>
            <div
              className='arrow-right-transition arrow-right-transition1'
              onClick={() => handleRedirect('/onboarding')}
            >
              <p className='get-start-landpage-p'>Get Started</p>
              <ArrowRight className='arrow-right-icon-landpage' />
            </div>
            <div className='features-card-pricing'>
              <p>What's included</p>
              <p><CheckIcon size={22} /> Market Signals and Alerts</p>
              <p><CheckIcon size={22} /> Portfolio Tracking up to 5</p>
              <p><CheckIcon size={22} /> Beginner and Intermediate Strategies</p>
              <p><CheckIcon size={22} /> Real-time Market Data</p>
              <p><CheckIcon size={22} /> Risk Assessment Tools</p>
              <p><CheckIcon size={22} /> Community Access</p>
            </div>
          </div>
        </div>

        {/* pro */}
        <div className='pricing-card-landpage'>
          <div className='pricing-card-l pricing-card-l2'>
            <p>Veltro Pro</p>
            <p>Unlimited access to every tool, signal, and strategy Veltro has to offer. Built for investors who play to win.</p>
            <p>$349<span>/one-time</span></p>
            <div
              className='arrow-right-transition arrow-right-transition2'
              onClick={() => handleRedirect('/onboarding')}
            >
              <p className='get-start-landpage-p'>Go Pro</p>
              <ArrowRight className='arrow-right-icon-landpage' />
            </div>
            <div className='features-card-pricing'>
              <p>Everything in Essential, plus</p>
              <p><CheckIcon /> Unlimited Portfolio Tracking</p>
              <p><CheckIcon /> AI Powered Trade Signals</p>
              <p><CheckIcon /> Beat the Market Strategy Vault</p>
              <p><CheckIcon /> Advanced Risk and Trend Analysis</p>
              <p><CheckIcon /> Priority Market Alerts</p>
              <p><CheckIcon /> 1 on 1 Investor Onboarding Call</p>
              <p><CheckIcon /> Lifetime Updates and New Features</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}