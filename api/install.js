// api/install.js
// Vercel serverless function — serves the signed mobileconfig with correct MIME type
// Route: GET /api/install → iOS intercepts and shows native install sheet

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default function handler(req, res) {
  try {
    // Mobileconfig lives at project root /ota/veltro_signed.mobileconfig
    const filePath = join(__dirname, '..', 'ota', 'veltro_signed.mobileconfig')
    const data = readFileSync(filePath)

    res.setHeader('Content-Type', 'application/x-apple-aspen-config')
    res.setHeader('Content-Disposition', 'attachment; filename="veltro_signed.mobileconfig"')
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).send(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
