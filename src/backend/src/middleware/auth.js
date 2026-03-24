// src/middleware/auth.js
import jwt from 'jsonwebtoken'

export default function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Authentication required.' })

  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user   = payload          // full payload
    req.userId = payload.sub      // convenience alias
    next()
  } catch (err) {
    const expired = err.name === 'TokenExpiredError'
    return res.status(401).json({
      message: expired ? 'Session expired. Please sign in again.' : 'Invalid token.',
      expired,
    })
  }
}

// Named export alias for routes that use requireAuth
export { authMiddleware as requireAuth }