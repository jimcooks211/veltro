import { useState, useEffect } from 'react'
import { useInView } from '../../hooks/useInView'
import VeltroDarkLogo from '@/components/VeltroDarkLogo';
import VeltroLightLogo from '@/components/VeltroLogoLight';
import { ArrowRight, ListIcon, Star } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import './public.css';
import IMG from './users/user-1.jpg';
import IMG1 from './users/user-2.jpg';
import IMG2 from './users/user-3.jpg';
import IMG3 from './users/user-4.jpg';
import About from './About';
import Pricing from './Pricing';
import Service from './Service';
import Blog from './Blog';
import BlogPost from './Footer'
import Menu from './Menu';


export default function Landing() {
  const [phase, setPhase] = useState('hidden')

  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  const [headlineRef,    headlineInView]    = useInView()
  const [subtextRef,     subtextInView]     = useInView()
  const [ctaRef,         ctaInView]         = useInView()
  const [interceptorRef, interceptorInView] = useInView()

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

  const [scrolled, setScrolled] = useState(false)
  const [menuactive, setmenuactive] = useState(false)

  useEffect(() => {
    if (menuactive) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
  }, [menuactive])

  useEffect(() => {
    // ~2rem = 32px — header goes frosted only after this threshold
    const handleScroll = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    const offset = (3 / 100) * window.innerWidth
    const top = el.getBoundingClientRect().top + window.scrollY - offset - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const isVisible = (inView) =>
    phase === 'animating' || (phase === 'live' && inView)

  const [leaving, setLeaving] = useState(false)

  const handleRedirect = (path) => {
    setLeaving(true)
    setTimeout(() => window.location.href = path, 500)
  }

useEffect(() => {
  console.log('API URL:', import.meta.env.VITE_API_URL)  // ← add this

  fetch(`${import.meta.env.VITE_API_URL}/api/analytics/visit`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page:     '/',
      referrer: document.referrer || null,
    }),
  }).catch((err) => console.error('Fetch failed:', err))  // ← change catch to log
}, [])

  return (
    <>
      <div className={`landing-container ${leaving ? 'page-exit' : ''}`}>

        {/* HEADER */}
        <div className='landing-header-container'>
          <div
            className={`landing-header ${scrolled ? 'header-scrolled' : ''}`}
            style={scrolled
              ? { background: isDark ? '#080C1A' : 'rgb(255, 255, 255)' }
              : { background: 'transparent', backdropFilter: 'none', boxShadow: 'none', border: 'none' }
            }
          >
            <div className='landing-logo-container'>
              <div className='landing-logo'>
                {isDark ? <VeltroDarkLogo /> : <VeltroLightLogo />}
              </div>
            </div>
            <div className='menu-bar-landing'>
              <p onClick={() => scrollTo('about')}>About Us</p>
              <p onClick={() => scrollTo('pricing')}>Pricing</p>
              <p onClick={() => scrollTo('services')}>Services</p>
              <p onClick={() => scrollTo('faq')}>FAQ</p>
              <p onClick={() => scrollTo('contact')}>Contact</p>
            </div>
            <div className='menu-contact-button-div'>
              <div
                className="menu-contact-btn"
                onClick={() => {
                  if (window.innerWidth >= 1240) {
                    window.location.href = '/onboarding'
                  } else {
                    setmenuactive(true)
                  }
                }}
              >
                <span className="btn-label-menu">
                  <ListIcon
                    style={isDark
                      ? { color: "white", transform: "translate(-10px, 0)" }
                      : { color: "#080C1A", transform: "translate(-10px, 0)" }
                    }
                    size={24}
                  />
                </span>
                <button className="btn-label-signin">Sign In</button>
              </div>
            </div>
          </div>
        </div>

        {menuactive && <Menu close={() => setmenuactive(false)} />}

        {/* HERO */}
        <div className={`landpage ${!isDark ? "landpage-light" : ""}`}>

          <div
            ref={headlineRef}
            className={`reveal ${isVisible(headlineInView) ? 'visible' : ''}`}
          >
            <h1>The market has a winning side. We will put you on it.</h1>
          </div>

          <div
            ref={subtextRef}
            className={`reveal ${isVisible(subtextInView) ? 'visible' : ''}`}
            style={{ transitionDelay: '120ms' }}
          >
            <p>Veltro gives every investor, beginner or seasoned, the exact strategies, signals, and intelligence used to consistently beat the market. No guesswork. No noise. Just an edge.</p>
          </div>

          <div
            ref={ctaRef}
            className={`third-row-first-page-land reveal ${isVisible(ctaInView) ? 'visible' : ''}`}
            style={{ transitionDelay: '240ms' }}
          >
            <div className='arrow-right-transition' onClick={() => handleRedirect('/onboarding')}>
              <p className='get-start-landpage-p'>Start Winning</p>
              <ArrowRight className='arrow-right-icon-landpage' />
            </div>
            <div className='last-landpage-first-row'>
              <div className='last-landpage-first-row-profiles'>
                <Avatar className="img-land">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar className="img-land img-land1">
                  <AvatarImage src={IMG} />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar className="img-land img-land1">
                  <AvatarImage src={IMG3} />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar className="img-land img-land1">
                  <AvatarImage src={IMG2} />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar className="img-land img-land1">
                  <AvatarImage src={IMG1} />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </div>
              <div className='stars-landpage'>
                <div className='stars-landpage-body'>
                  <Star className='stars-landpage1' weight='fill' />
                  <Star className='stars-landpage1' weight='fill' />
                  <Star className='stars-landpage1' weight='fill' />
                  <Star className='stars-landpage1' weight='fill' />
                  <Star className='stars-landpage1' weight='fill' />
                </div>
                <p>Trusted by 1000+ investors</p>
              </div>
            </div>
          </div>

          <div
            ref={interceptorRef}
            className={`landpage-interceptor reveal ${isVisible(interceptorInView) ? 'visible' : ''}`}
            style={{ transitionDelay: '360ms' }}
          >
            <div className="border-line-landpage"></div>
            <p>Outperforming markets across 30+ countries every single day</p>
            <div className="border-line-landpage"></div>
          </div>

        </div>

        {/* SECTIONS */}
        <div id="about"><About /></div>
        <div id="pricing"><Pricing /></div>
        <div id="services"><Service /></div>
        <div id="faq"><Blog /></div>
        <div id="contact"><BlogPost /></div>

      </div>
    </>
  )
}