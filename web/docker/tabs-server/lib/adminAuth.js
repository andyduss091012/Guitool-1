/**
 * Gate for the admin-only import endpoint. Fails *closed*: if the operator
 * hasn't set ADMIN_IMPORT_TOKEN, importing is disabled entirely rather than
 * silently open. Uses a plain shared-secret bearer token (not a full
 * auth/authz system) — appropriate for the "trusted home/LAN, one or a
 * few admins" scale this whole server is built for (see server.js's own
 * doc comment); swap in real auth before exposing this beyond that.
 */
const crypto = require('node:crypto')

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

function requireAdminToken(req, res, next) {
  const configured = process.env.ADMIN_IMPORT_TOKEN
  if (!configured) {
    res.status(503).json({ error: 'Admin import is disabled: set ADMIN_IMPORT_TOKEN on the tabs-server to enable it.' })
    return
  }
  const header = req.get('authorization') || ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!provided || !timingSafeEqual(provided, configured)) {
    res.status(401).json({ error: 'Missing or invalid admin token.' })
    return
  }
  next()
}

module.exports = { requireAdminToken }
