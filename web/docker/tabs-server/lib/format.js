/**
 * Detects/validates an imported tab's actual file format instead of
 * blindly trusting or renaming everything to `.gp`. The admin-supplied
 * filename's extension picks the format; a cheap sanity check against the
 * real bytes catches an obviously mislabeled upload (e.g. a `.gpx` that
 * isn't actually a zip) without trying to be a full Guitar Pro parser —
 * `TabPlayer.tsx`'s alphaTab dependency already owns that job at playback
 * time.
 */

// Guitar Pro's binary formats (.gp3/.gp4/.gp5) and the modern zip-based
// ones (.gp7, and the older .gpx), plus AlphaTex (.tex) — a plain-text
// notation source alphaTab can also render directly. `.gp` (no version
// number) is kept for parity with the existing read-only server's list.
const ALLOWED_FORMATS = ['gp', 'gp3', 'gp4', 'gp5', 'gp7', 'gpx', 'tex']

// Generous for a Guitar Pro file (these are almost always well under 1MB)
// while still bounding memory use and stopping an accidental wrong-file
// upload cold. Overridable via env for anyone who genuinely needs more.
const MAX_FILE_BYTES = Number(process.env.MAX_TAB_FILE_BYTES) || 25 * 1024 * 1024

class UnsupportedFormatError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UnsupportedFormatError'
    this.statusCode = 400
  }
}

function extensionOf(filename) {
  const idx = (filename || '').lastIndexOf('.')
  if (idx <= 0) return ''
  return filename.slice(idx + 1).toLowerCase()
}

function looksLikeZip(buffer) {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b // 'PK'
}

function looksLikeText(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 2000))
  for (const byte of sample) {
    if (byte === 0) return false // a NUL byte this early strongly suggests binary, not AlphaTex text
  }
  return true
}

/**
 * @param {string} filename admin-supplied original filename (used for its extension only — never used as a storage path)
 * @param {Buffer} buffer the file's actual bytes
 * @returns {{ format: string }}
 */
function detectFormat(filename, buffer) {
  const ext = extensionOf(filename)
  if (!ALLOWED_FORMATS.includes(ext)) {
    throw new UnsupportedFormatError(
      `Unsupported file type "${ext ? '.' + ext : '(none)'}" — expected one of: ${ALLOWED_FORMATS.map((f) => '.' + f).join(', ')}.`,
    )
  }
  if ((ext === 'gpx' || ext === 'gp7') && !looksLikeZip(buffer)) {
    throw new UnsupportedFormatError(`File extension is .${ext} but the file's contents don't look like a valid zip-based Guitar Pro file.`)
  }
  if (ext === 'tex' && !looksLikeText(buffer)) {
    throw new UnsupportedFormatError(`File extension is .tex but the file's contents don't look like plain-text AlphaTex.`)
  }
  return { format: ext }
}

module.exports = { detectFormat, ALLOWED_FORMATS, MAX_FILE_BYTES, UnsupportedFormatError }
