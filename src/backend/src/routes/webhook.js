import express from 'express'
import crypto  from 'crypto'

const router = express.Router()

const log = {
  info:    (msg) => console.log(`\x1b[36m[webhook]\x1b[0m ${msg}`),
  ok:      (msg) => console.log(`\x1b[32m[webhook]\x1b[0m ${msg}`),
  warn:    (msg) => console.log(`\x1b[33m[webhook]\x1b[0m ${msg}`),
  error:   (msg) => console.log(`\x1b[31m[webhook]\x1b[0m ${msg}`),
  data:    (obj) => console.log('\x1b[90m' + JSON.stringify(obj, null, 2) + '\x1b[0m'),
  divider: ()    => console.log('\x1b[90m' + '─'.repeat(52) + '\x1b[0m'),
}

router.post('/mailersend', express.raw({ type: 'application/json' }), (req, res) => {
  log.divider()
  log.info(`incoming POST  ${new Date().toISOString()}`)

  try {
    const signature = req.headers['x-mailersend-signature']
    const secret    = process.env.MAILERSEND_SIGNING_SECRET

    if (!secret) {
      log.error('MAILERSEND_SIGNING_SECRET not set in .env')
      return res.status(500).json({ error: 'Server misconfigured' })
    }

    const rawBody = req.body
    const hmac    = crypto.createHmac('sha256', secret)
    hmac.update(rawBody)
    const digest = hmac.digest('hex')

    if (digest !== signature) {
      log.warn('signature mismatch — possible spoofed request')
      log.warn(`expected: ${digest}`)
      log.warn(`received: ${signature}`)
      return res.status(401).json({ error: 'Unauthorized' })
    }

    log.ok('signature verified ✓')

    const event     = JSON.parse(rawBody.toString())
    const eventType = event?.type
    const recipient = event?.data?.email?.recipient?.email ?? 'unknown'
    const subject   = event?.data?.email?.subject         ?? '—'
    const createdAt = event?.created_at                   ?? '—'

    log.ok(`event type : ${eventType}`)
    log.info(`recipient  : ${recipient}`)
    log.info(`subject    : ${subject}`)
    log.info(`created at : ${createdAt}`)
    log.info('full payload ↓')
    log.data(event)

    switch (eventType) {
      case 'activity.sent':
        log.ok('email was sent successfully')
        break
      case 'activity.delivered':
        log.ok('email delivered to recipient server')
        break
      case 'activity.opened':
        log.ok('recipient opened the email')
        break
      case 'activity.clicked':
        log.ok('recipient clicked a link')
        break
      case 'activity.soft_bounced':
        log.warn('soft bounce — temporary delivery failure')
        break
      case 'activity.hard_bounced':
        log.error('hard bounce — address invalid or blocked')
        break
      case 'activity.spam_complaint':
        log.error('spam complaint received')
        break
      case 'activity.unsubscribed':
        log.warn('recipient unsubscribed')
        break
      case 'sender_identity.verified':
        log.ok('sender identity verified')
        break
      default:
        log.warn(`unhandled event type: ${eventType}`)
    }

    log.divider()
    return res.status(200).json({ received: true })
  } catch (err) {
    log.error(`error processing event: ${err.message}`)
    log.divider()
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router