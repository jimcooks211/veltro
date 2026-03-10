import {
  ArrowRight,
  Brain,
  ChartLineUp,
  ShieldCheck,
  Robot,
  BookOpen,
} from '@phosphor-icons/react'
import React, { useState } from 'react'
import { useInView } from '../../hooks/useInView'
import './public.css'

export default function Service() {
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
        className={`innovation-title-service reveal ${titleInView ? 'visible' : ''}`}
      >
        Every tool serious investors need. All in one platform.
      </p>

      <div
        ref={cardsRef}
        className={`service-card-container reveal-children ${cardsInView ? 'visible' : ''}`}
      >
        <div className="services-card services-card-one">
          <Brain size={28} />
          <p>Market Intelligence and Signals</p>
        </div>

        <div className="services-card services-card1">
          <ChartLineUp size={28} />
          <p>Portfolio Management</p>
        </div>

        <div className="services-card services-card2">
          <Robot size={28} />
          <p>AI Trade Recommendations</p>
        </div>

        <div className="services-card services-card3">
          <ShieldCheck size={28} />
          <p>Risk Analysis</p>
        </div>

        <div className="services-card services-card4">
          <BookOpen size={28} />
          <p>Investment Strategy Vault</p>
        </div>

        <div className="services-card service-card5">
          <p>Intelligence. Precision. Growth. Security. Everything Veltro offers lives inside one platform built to make you a better investor.</p>
          <div className='service-card5-btn'>
            <div
              className='arrow-right-transition'
              onClick={() => handleRedirect('/onboarding')}
            >
              <p className='get-start-landpage-p'>Start Winning</p>
              <ArrowRight className='arrow-right-icon-landpage' />
            </div>
            <div
              className='arrow-right-transition'
              onClick={() => handleRedirect('/services')}
            >
              <p className='get-start-landpage-p'>View All Services</p>
              <ArrowRight className='arrow-right-icon-landpage' />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}