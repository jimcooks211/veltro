// useInView.js
import { useEffect, useRef, useState } from 'react'

export function useInView(options = {}) {
  const { once = false, threshold = 0.1, rootMargin = '-16px 0px -60px 0px', ...rest } = options
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  const [exitingTop, setExitingTop] = useState(false) // 👈 new
  const lastY = useRef(window.scrollY)
  const timer = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      const currentY = window.scrollY
      const scrollingDown = currentY > lastY.current
      lastY.current = currentY

      if (timer.current) clearTimeout(timer.current)

      if (entry.isIntersecting) {
  setInView(true)
  if (once) observer.disconnect() // 👈 fires once, never resets
} else {
  if (!once) { // only reset if once is false
    if (scrollingDown) {
      timer.current = setTimeout(() => setInView(false), 100)
      setExitingTop(false)
    } else {
      setExitingTop(true)
      setInView(false)
    }
  }
}
    }, { threshold, rootMargin, ...rest })

    if (ref.current) observer.observe(ref.current)
    return () => {
      observer.disconnect()
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return [ref, inView, exitingTop] // 👈 expose it
}