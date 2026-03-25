import { useEffect, useRef, useState, useCallback } from 'react'
import { X } from '@phosphor-icons/react'

const rubber = (delta, k = 0.4) =>
  (1 - 1 / (Math.abs(delta) * k + 1)) * Math.sign(delta) / k

export default function VeltroModal({
  open,
  onClose,
  title     = 'Modal',
  children,
  defaultVh = 0.70,
  minVh     = 0.0,
  maxVh     = 0.96,
  closeAt   = 0.40,
}) {
  const sheetRef   = useRef(null)
  const bodyRef    = useRef(null)
  const overlayRef = useRef(null)
  const rafId      = useRef(null)

  // ── ALL pending timers tracked in one ref so we can cancel everything ──
  const timers = useRef([])
  const addTimer = (fn, ms) => {
    const id = setTimeout(() => {
      timers.current = timers.current.filter(t => t !== id)
      fn()
    }, ms)
    timers.current.push(id)
    return id
  }
  const clearAllTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const d = useRef({
    active: false,
    phase: 'idle',
    startClientY: 0,
    startHeight: 0,
  })

  // Reset ALL transient drag/snap state -- call on every open
  const resetDragState = () => {
    d.current.active       = false
    d.current.phase        = 'idle'
    d.current.startClientY = 0
    d.current.startHeight  = 0
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = null }
  }

  const [fullscreen, setFullscreen] = useState(false)
  const [visible,    setVisible]    = useState(false)
  const [mounted,    setMounted]    = useState(false)

  /* ── Mount / unmount ──────────────────────────────────────────────
     On every open: cancel ALL stale timers first, then reset state.
     This prevents any previous close cycle from polluting the new open.
  ─────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (open) {
      // Kill every pending timer from any previous close/snap cycle
      clearAllTimers()
      resetDragState()

      // Clear any leftover inline styles from previous session
      if (sheetRef.current) sheetRef.current.style.cssText = ''

      setFullscreen(false)
      setVisible(false)
      setMounted(true)

      // Double rAF so the browser has painted before animating in
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      )
    } else {
      setVisible(false)
      addTimer(() => {
        resetDragState()
        setMounted(false)
        if (sheetRef.current) sheetRef.current.style.cssText = ''
      }, 380)
    }

    // Cleanup: if the effect re-runs (prop flips rapidly) kill pending timers
    return () => clearAllTimers()
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* ── Close ────────────────────────────────────────────────────── */
  const doClose = useCallback(() => {
    setVisible(false)
    addTimer(() => {
      resetDragState()
      setFullscreen(false)
      onClose?.()
    }, 380)
  }, [onClose])

  /* ── Escape ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return
    const h = (e) => {
      if (e.key !== 'Escape') return
      fullscreen ? setFullscreen(false) : doClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, fullscreen, doClose])

  const applyHeight = (sheet, px) => {
    sheet.style.height    = `${px}px`
    sheet.style.maxHeight = `${px}px`
  }

  const beginDrag = useCallback((clientY, sheet) => {
    // Block if fullscreen OR if a snap is in progress
    if (fullscreen || d.current.phase !== 'idle') return false
    d.current.active       = true
    d.current.startClientY = clientY
    d.current.startHeight  = sheet.offsetHeight
    sheet.style.transition = 'none'
    sheet.style.willChange = 'height'
    return true
  }, [fullscreen])

  const applyDragFrame = useCallback((sheet, clientY) => {
    const vh   = window.innerHeight
    const dy   = d.current.startClientY - clientY
    const rawH = d.current.startHeight + dy
    const minH = vh * minVh
    const maxH = vh * maxVh

    let visualH
    if (rawH >= minH && rawH <= maxH) {
      visualH = rawH
    } else if (rawH > maxH) {
      visualH = maxH + rubber(rawH - maxH) * 50
    } else {
      visualH = Math.max(minH - rubber(minH - rawH) * 40, vh * 0.10)
    }

    applyHeight(sheet, visualH)
  }, [minVh, maxVh])

  /* ── Fullscreen bloom snap ────────────────────────────────────── */
  const snapToFullscreen = useCallback((sheet) => {
    const vh = window.innerHeight
    d.current.phase = 'snapping'

    sheet.style.transition   = 'none'
    sheet.style.height       = `${vh}px`
    sheet.style.maxHeight    = `${vh}px`
    sheet.style.borderRadius = '16px'
    sheet.style.transform    = 'scale(0.96)'
    sheet.style.opacity      = '0.5'

    requestAnimationFrame(() => requestAnimationFrame(() => {
      // Guard: modal may have been closed during this rAF
      if (!sheetRef.current || d.current.phase !== 'snapping') return
      sheet.style.transition = [
        'transform     420ms cubic-bezier(0.22, 1, 0.36, 1)',
        'opacity       300ms ease',
        'border-radius 420ms ease',
      ].join(', ')
      sheet.style.transform    = 'scale(1)'
      sheet.style.opacity      = '1'
      sheet.style.borderRadius = '0px'
    }))

    addTimer(() => {
      // Guard: only commit if we're still in this snap, not closed mid-way
      if (d.current.phase !== 'snapping') return
      if (sheetRef.current) sheetRef.current.style.cssText = ''
      d.current.phase = 'idle'
      setFullscreen(true)
    }, 440)
  }, [])

  /* ── End drag ─────────────────────────────────────────────────── */
  const endDrag = useCallback((clientY) => {
    if (!d.current.active) return
    d.current.active = false
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = null }

    const sheet = sheetRef.current
    if (!sheet || d.current.phase !== 'idle') return

    const vh       = window.innerHeight
    const currentH = sheet.offsetHeight
    const fraction = currentH / vh

    sheet.style.transition = ''
    sheet.style.willChange = ''

    /* CLOSE */
    if (fraction <= closeAt) {
      d.current.phase = 'snapping'
      sheet.style.transition = 'height 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 280ms ease'
      sheet.style.opacity = '0'
      applyHeight(sheet, 0)
      addTimer(() => {
        d.current.phase = 'idle'
        doClose()
      }, 340)
      return
    }

    /* FULLSCREEN */
    if (fraction >= maxVh - 0.02) {
      snapToFullscreen(sheet)
      return
    }

    /* SNAP BACK */
    sheet.style.transition = 'height 400ms cubic-bezier(0.32, 0.72, 0, 1), max-height 400ms cubic-bezier(0.32, 0.72, 0, 1)'
    applyHeight(sheet, vh * defaultVh)
    addTimer(() => {
      if (!d.current.active && sheetRef.current) {
        sheetRef.current.style.height     = ''
        sheetRef.current.style.maxHeight  = ''
        sheetRef.current.style.transition = ''
      }
    }, 420)
  }, [doClose, closeAt, maxVh, defaultVh, snapToFullscreen])

  const onPointerDown = useCallback((e) => {
    const sheet = sheetRef.current
    if (!sheet) return
    if (beginDrag(e.clientY, sheet)) e.currentTarget.setPointerCapture(e.pointerId)
  }, [beginDrag])

  const onPointerMove = useCallback((e) => {
    if (!d.current.active) return
    const clientY = e.clientY
    if (rafId.current) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      if (!d.current.active) return
      const sheet = sheetRef.current
      if (sheet) applyDragFrame(sheet, clientY)
    })
  }, [applyDragFrame])

  const onPointerUp = useCallback((e) => endDrag(e.clientY), [endDrag])

  /* ── Touch handoff ────────────────────────────────────────────── */
  useEffect(() => {
    const body  = bodyRef.current
    const sheet = sheetRef.current
    if (!body || !sheet || fullscreen) return

    let startY      = 0
    let initiated   = false
    let lastClientY = 0

    const onTouchStart = (e) => {
      startY      = e.touches[0].clientY
      lastClientY = startY
      initiated   = false
    }

    const onTouchMove = (e) => {
      const clientY = e.touches[0].clientY
      const dy      = clientY - startY

      if (body.scrollTop > 2 && dy > 0) return

      if (!initiated && body.scrollTop <= 0 && (dy < -6 || dy > 6)) {
        initiated = true
        e.preventDefault()
        beginDrag(clientY, sheet)
        return
      }

      if (initiated && d.current.active) {
        e.preventDefault()
        lastClientY = clientY
        if (!rafId.current) {
          rafId.current = requestAnimationFrame(() => {
            rafId.current = null
            if (d.current.active) applyDragFrame(sheet, lastClientY)
          })
        }
      }
    }

    const onTouchEnd = () => {
      if (initiated && d.current.active) endDrag(lastClientY)
      initiated = false
    }

    body.addEventListener('touchstart', onTouchStart, { passive: true  })
    body.addEventListener('touchmove',  onTouchMove,  { passive: false })
    body.addEventListener('touchend',   onTouchEnd,   { passive: true  })

    return () => {
      body.removeEventListener('touchstart', onTouchStart)
      body.removeEventListener('touchmove',  onTouchMove)
      body.removeEventListener('touchend',   onTouchEnd)
    }
  }, [fullscreen, beginDrag, applyDragFrame, endDrag])

  if (!mounted) return null

  return (
    <div
      ref={overlayRef}
      className={`vm-overlay ${visible ? 'vm-visible' : ''}`}
      onClick={(e) => { if (e.target === overlayRef.current) doClose() }}
    >
      <div
        ref={sheetRef}
        className={[
          'vm-sheet',
          visible    ? 'vm-sheet-in'   : 'vm-sheet-out',
          fullscreen ? 'vm-fullscreen' : '',
        ].filter(Boolean).join(' ')}
      >
        <div
          className={['vm-drag-zone', fullscreen ? 'vm-drag-zone-fs' : ''].filter(Boolean).join(' ')}
          onPointerDown={!fullscreen ? onPointerDown : undefined}
          onPointerMove={!fullscreen ? onPointerMove : undefined}
          onPointerUp={!fullscreen   ? onPointerUp   : undefined}
        >
          {!fullscreen && (
            <div className='vm-handle-zone'>
              <div className='vm-handle' />
            </div>
          )}
          <div className='vm-header'>
            <h2 className='vm-title'>{title}</h2>
            <button
              className='vm-close'
              onClick={doClose}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label='Close'
            >
              <X size={16} weight='bold' />
            </button>
          </div>
          <div className='vm-header-rule' aria-hidden='true'>
            <div className='vm-header-rule-glow' />
          </div>
        </div>

        <div ref={bodyRef} className='vm-body'>
          {children}
          <div className='vm-body-filler' aria-hidden='true' />
        </div>
      </div>
    </div>
  )
}