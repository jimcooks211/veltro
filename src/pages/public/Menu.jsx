import React, { useState, useEffect } from "react";
import VeltroLogoDark from "../../components/VeltroDarkLogo";
import VeltroLogoLight from "../../components/VeltroLogoLight";
import { X } from "@phosphor-icons/react";
import './public.css'

const NAV_ITEMS = [
    { label: 'About Us',  id: 'about'    },
    { label: 'Pricing',   id: 'pricing'  },
    { label: 'Services',  id: 'services' },
    { label: 'FAQ',       id: 'faq'      },
    { label: 'Contact',   id: 'contact'  },
]

export default function Menu({ close }) {
    const [isDark, setIsDark] = useState(
        () => window.matchMedia('(prefers-color-scheme: dark)').matches
    )
    const [isOpen, setIsOpen] = useState(false)

    // trigger entrance animation on mount
    useEffect(() => {
        const t = requestAnimationFrame(() => setIsOpen(true))
        return () => cancelAnimationFrame(t)
    }, [])

    // track system color scheme
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e) => setIsDark(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    // animate out before unmounting
    const handleClose = () => {
        setIsOpen(false)
        setTimeout(close, 350)
    }

    const scrollTo = (id) => {
        const el = document.getElementById(id)
        if (!el) return
        handleClose()
        setTimeout(() => {
            const offset = (3 / 100) * window.innerWidth
            const top = el.getBoundingClientRect().top + window.scrollY - offset - 80
            window.scrollTo({ top, behavior: 'smooth' })
        }, 360)
    }

    const bg     = isDark ? '#0A0F1E'                        : '#ffffff'
    const color  = isDark ? '#F0F4FF'                        : '#0A0F1E'
    const border = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'

    const [leaving, setLeaving] = useState(false)
    
    const handleRedirect = (path) => {
      setLeaving(true)
      setTimeout(() => window.location.href = path, 500)
    }

    return (
        <>
            {/* overlay */}
            <div
                onClick={handleClose}
                style={{
                    position: "fixed", inset: "0",
                    background: "rgba(0,0,0,0.4)",
                    zIndex: "998",
                    backdropFilter: "blur(2px)",
                    opacity: isOpen ? 1 : 0,
                    transition: "opacity 350ms ease"
                }}
            />

            {/* panel */}
            <div style={{
                position: "fixed", width: "23rem", right: "0", top: "0",
                background: bg, padding: "15px", height: "100vh", zIndex: "999",
                borderLeft: border,
                transform: isOpen ? "translateX(0)" : "translateX(100%)",
                transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1), background 300ms ease-in-out"
            }} className={`landing-container ${leaving ? 'page-exit' : ''}`}>

                {/* header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ scale: "0.7", transform: "translate(-3.2rem, 0)" }}>
                        {isDark ? <VeltroLogoDark /> : <VeltroLogoLight />}
                    </div>
                    <X size={24} style={{ color, cursor: "pointer" }} onClick={handleClose} />
                </div>

                {/* nav items — stagger in from right */}
                <div style={{
                    display: "grid", gap: "1rem", fontSize: "15px",
                    fontFamily: "'Inter', sans-serif", color, margin: "2rem 10px"
                }}>
                    {NAV_ITEMS.map(({ label, id }, i) => (
                        <p
                            key={id}
                            className="menu-landpage-p"
                            onClick={() => scrollTo(id)}
                            style={{
                                opacity: isOpen ? 1 : 0,
                                transform: isOpen ? "translateX(0)" : "translateX(40px)",
                                transition: `opacity 350ms ease ${i * 60 + 100}ms, transform 350ms ease ${i * 60 + 100}ms`,
                                cursor: "pointer"
                            }}
                        >
                            {label}
                        </p>
                    ))}
                </div>

                {/* button — animates in last */}
                <div style={{
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? "translateX(0)" : "translateX(40px)",
                    transition: "opacity 350ms ease 400ms, transform 350ms ease 400ms"
                }}>
                    <button
                        style={{
                            width: "100%", padding: "15px 0",
                            background: isDark ? '#F0F4FF' : '#0A0F1E',
                            color: isDark ? '#0A0F1E' : '#ffffff',
                            fontSize: "15px", fontFamily: "'Inter', sans-serif",
                            borderRadius: "100px",
                            transition: "background 300ms ease-in-out",
                            cursor: "pointer"
                        }}
                        className={!isDark ? "menu-landpage-btn" : "menu-landpage-btn2"}
                        onClick={() => handleRedirect('/onboarding')}
                    >
                        Log In / Sign Up
                    </button>
                </div>

            </div>
        </>
    )
}