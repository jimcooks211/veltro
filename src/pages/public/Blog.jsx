import React from 'react'
import { useInView } from '../../hooks/useInView'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import './public.css'

export default function Blog() {
  const [titleRef, titleInView]         = useInView()
  const [accordionRef, accordionInView] = useInView()

  return (
    <div>

      <p
        ref={titleRef}
        className={`blog-p-landpage reveal ${titleInView ? 'visible' : ''}`}
      >
        Real questions, Straight answers.
      </p>

      <div
        ref={accordionRef}
        className={`reveal-children ${accordionInView ? 'visible' : ''}`}
      >
        <Accordion type="single" collapsible>

          <AccordionItem value="item-1" className="accordion-item">
            <AccordionTrigger className="accordion-trigger">
              What exactly is Veltro and who is it built for?
            </AccordionTrigger>
            <AccordionContent className="accordion-content">
              Veltro is a next-generation investment intelligence platform built for anyone who takes their financial future seriously. From first-time investors learning the ropes to seasoned traders looking for a sharper edge, if you want to stop guessing and start making data-driven decisions, Veltro was built for you.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="accordion-item">
            <AccordionTrigger className="accordion-trigger">
              How is Veltro different from other investment platforms?
            </AccordionTrigger>
            <AccordionContent className="accordion-content">
              Most platforms show you the market and leave you to figure out what to do. Veltro tells you exactly what to do and why. Our AI-powered signals, beat-the-market strategy vault, and real-time risk analysis give every investor access to the kind of intelligence that was previously only available to institutional traders and hedge funds.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="accordion-item">
            <AccordionTrigger className="accordion-trigger">
              Is Veltro suitable for complete beginners?
            </AccordionTrigger>
            <AccordionContent className="accordion-content">
              Absolutely. Veltro was designed so that a beginner can walk in with zero experience and walk out with a clear, actionable investment strategy within minutes. Our Financial Education library and onboarding tools break down complex market concepts into clear, practical steps. You will never feel lost, never feel overwhelmed, and always be moving forward.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="accordion-item">
            <AccordionTrigger className="accordion-trigger">
              Why is Veltro a one-time payment and not a subscription?
            </AccordionTrigger>
            <AccordionContent className="accordion-content">
              Because your returns should not be eaten by recurring fees. We built Veltro on the belief that the platform should work for you, not drain you. One payment gives you lifetime access to the platform, all future updates, and every new feature we ship. No surprises on your statement, ever.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="accordion-item">
            <AccordionTrigger className="accordion-trigger">
              What markets and assets does Veltro cover?
            </AccordionTrigger>
            <AccordionContent className="accordion-content">
              Veltro covers global equities, ETFs, commodities, forex, and cryptocurrencies, giving you a complete picture of where opportunity exists across every major market. Whether you are investing in US tech stocks, international indices, or emerging digital assets, Veltro's intelligence engine has you covered.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="accordion-item">
            <AccordionTrigger className="accordion-trigger">
              How secure is my data and financial information on Veltro?
            </AccordionTrigger>
            <AccordionContent className="accordion-content">
              Security is non-negotiable at Veltro. We use bank-grade encryption, two-factor authentication, and zero-knowledge architecture to ensure your data stays yours, always. We never sell, share, or monetise your personal or financial information. Your privacy and security are the foundation everything else is built on.
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>

    </div>
  )
}