/**
 * A deliberately simple fixed-window rate limiter — in-memory, per
 * process, no external dependency. Good enough for "stop an admin token
 * (leaked or scripted) from hammering imports," not meant to survive a
 * multi-instance deployment (each instance would count independently);
 * see the README's known-limitations note.
 */
function createFixedWindowLimiter({ windowMs, max }) {
  let windowStart = Date.now()
  let count = 0
  return function tryAcquire() {
    const now = Date.now()
    if (now - windowStart >= windowMs) {
      windowStart = now
      count = 0
    }
    count += 1
    return count <= max
  }
}

module.exports = { createFixedWindowLimiter }
