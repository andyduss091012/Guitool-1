/**
 * Guitool Tabs Server — a small shared-storage file-server for Guitar Pro
 * tab files, plus an admin-only import endpoint that lets an operator add
 * tabs to the shared library without rebuilding or redeploying anything.
 *
 * Two layers, on purpose:
 *
 *  - The original read-only layer (`/api/tabs`, `/api/tabs/:name`) is
 *    UNCHANGED: it still lists and serves whatever flat files an operator
 *    drops directly into TABS_DIR, exactly as before. Existing frontend
 *    clients (`src/services/tabShareApi.ts`) keep working without any
 *    changes on their side.
 *  - A newer, admin-imported layer stores each tab under its own
 *    `TABS_DIR/<id>/{tab.<ext>, metadata.json}` subdirectory (see
 *    `lib/tabStorage.js` / `lib/importer.js`), added onto the same
 *    `/api/tabs` listing and a new `/api/tabs/:id` + `/api/tabs/:id/file`
 *    pair, and populated via `POST /admin/tabs/import` or the `import:tab`
 *    CLI (`cli/importTab.js`) — see the README's "Admin tab import"
 *    section for the full request/response shapes and security model.
 *
 * Security model: still meant for a trusted home/LAN network behind the
 * rest of the docker-compose stack, not the public internet (permissive
 * CORS, no auth on reads). The *write* path is the one addition that needs
 * real gating even on a trusted network — see `lib/adminAuth.js`: import is
 * disabled by default and requires an operator-set `ADMIN_IMPORT_TOKEN`.
 */
const path = require('node:path')
const fs = require('node:fs/promises')
const express = require('express')
const multer = require('multer')

const { LocalTabStorage } = require('./lib/tabStorage')
const { importTab, ImportValidationError } = require('./lib/importer')
const { UnsupportedFormatError, MAX_FILE_BYTES } = require('./lib/format')
const { requireAdminToken } = require('./lib/adminAuth')
const { createFixedWindowLimiter } = require('./lib/rateLimit')

const TABS_DIR = process.env.TABS_DIR || '/data/tabs'
const PORT = Number(process.env.PORT) || 4001
const SUPPORTED_EXTENSIONS = ['.gp', '.gp3', '.gp4', '.gp5', '.gp7', '.gpx']

const storage = new LocalTabStorage(TABS_DIR)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_BYTES } })
// 10 imports/minute per process — see lib/rateLimit.js's doc comment for
// what this does and doesn't protect against.
const importRateLimited = createFixedWindowLimiter({ windowMs: 60_000, max: 10 })

const app = express()

// Permissive CORS on reads: this server has no auth on GET routes and is
// expected to sit behind a home/LAN network rather than the open internet
// (see the file-level doc comment). The admin import route is gated
// separately by a bearer token (lib/adminAuth.js), and that token is never
// read from a cookie, so a wildcard ACAO header here doesn't hand a
// random web page the ability to import on the admin's behalf.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

function hasSupportedExtension(fileName) {
  const lower = fileName.toLowerCase()
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** Rejects anything that isn't a bare file name inside TABS_DIR (no `..`, no path separators). */
function isSafeFileName(name) {
  return typeof name === 'string' && name.length > 0 && !name.includes('/') && !name.includes('\\') && name !== '.' && name !== '..'
}

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

// --- Legacy flat-file listing (unchanged) + admin-imported tabs (additive) ---
app.get('/api/tabs', async (req, res) => {
  let files = []
  let warning
  try {
    const entries = await fs.readdir(TABS_DIR, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || !hasSupportedExtension(entry.name)) continue
      const stat = await fs.stat(path.join(TABS_DIR, entry.name))
      files.push({
        name: entry.name,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      })
    }
    files.sort((a, b) => a.name.localeCompare(b.name))
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      // The shared folder hasn't been created / mounted yet — that's a
      // config issue for the operator, not a server crash.
      warning = `Shared tabs folder not found at ${TABS_DIR}.`
    } else {
      console.error('Failed to list tabs:', err)
      res.status(500).json({ error: 'Failed to list shared tabs.' })
      return
    }
  }

  // New: admin-imported tabs, listed alongside the legacy flat files under
  // a separate `tabs` key so existing clients (which only ever read
  // `data.files`) are completely unaffected by this key existing.
  let tabs = []
  try {
    const ids = await storage.list()
    const metas = await Promise.all(ids.map((id) => storage.readMetadata(id)))
    tabs = metas
      .filter(Boolean)
      .map((meta) => ({ ...meta, fileUrl: `/api/tabs/${encodeURIComponent(meta.id)}/file` }))
      .sort((a, b) => a.title.localeCompare(b.title))
  } catch (err) {
    console.error('Failed to list imported tabs:', err)
  }

  res.json({ files, tabs, warning })
})

// --- Unified :id route: legacy flat-file download (unchanged behavior)
//     falls through to the new imported-tab metadata lookup. ---
app.get('/api/tabs/:id', async (req, res) => {
  const { id } = req.params

  if (isSafeFileName(id) && hasSupportedExtension(id)) {
    const filePath = path.join(TABS_DIR, id)
    try {
      await fs.access(filePath)
      res.download(filePath, id, (err) => {
        if (err) console.error(`Failed to send ${id}:`, err)
      })
      return
    } catch {
      // Not an existing flat file — fall through to the imported-tab
      // lookup below. (A real flat filename colliding with a generated
      // hex id is effectively impossible, but falling through instead of
      // 404ing immediately costs nothing and keeps this branch simple.)
    }
  }

  try {
    const metadata = await storage.readMetadata(id)
    if (!metadata) {
      res.status(404).json({ error: 'Tab not found.' })
      return
    }
    res.json({ ...metadata, fileUrl: `/api/tabs/${encodeURIComponent(id)}/file` })
  } catch (err) {
    console.error(`Failed to read metadata for ${id}:`, err)
    res.status(500).json({ error: 'Failed to read tab metadata.' })
  }
})

// New: explicit file download for admin-imported tabs, addressed by id
// rather than by on-disk filename (their stored filename, `tab.<ext>`, is
// not unique across tabs the way legacy flat filenames are).
app.get('/api/tabs/:id/file', async (req, res) => {
  const { id } = req.params
  try {
    const metadata = await storage.readMetadata(id)
    if (!metadata) {
      res.status(404).json({ error: 'Tab not found.' })
      return
    }
    const data = await storage.read(id, metadata.fileName)
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.fileName}"`)
    res.send(data)
  } catch (err) {
    console.error(`Failed to read stored file for ${id}:`, err)
    res.status(500).json({ error: 'Failed to read stored file.' })
  }
})

// --- Admin-only: import a tab an admin already has the rights to store
//     (an upload, not a fetch — see lib/importer.js's doc comment). ---
app.post(
  '/admin/tabs/import',
  requireAdminToken,
  (req, res, next) => {
    if (!importRateLimited()) {
      res.status(429).json({ error: 'Too many imports — please slow down and try again shortly.' })
      return
    }
    next()
  },
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'A "file" upload field is required.' })
        return
      }
      const body = req.body || {}
      const result = await importTab(storage, {
        file: req.file.buffer,
        filename: req.file.originalname,
        title: body.title,
        artist: body.artist,
        source: body.source,
        externalId: body.externalId || undefined,
        sourceUrl: body.sourceUrl || undefined,
        license: body.license || undefined,
        canCache: body.canCache === 'true' || body.canCache === true,
        canRedistribute: body.canRedistribute === 'true' || body.canRedistribute === true,
      })
      res.status(result.alreadyExists ? 200 : 201).json({
        success: true,
        alreadyExists: result.alreadyExists,
        tab: result.tab,
      })
    } catch (err) {
      if (err instanceof ImportValidationError || err instanceof UnsupportedFormatError) {
        res.status(err.statusCode || 400).json({ error: err.message })
        return
      }
      console.error('Import failed:', err)
      res.status(500).json({ error: 'Import failed.' })
    }
  },
)

// Last-resort error handler — catches multer's file-too-large error (and
// anything else that reaches here) so a bad upload gets a clean JSON 4xx
// instead of an unhandled exception.
app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: `File too large (max ${MAX_FILE_BYTES} bytes).` })
    return
  }
  console.error('Unexpected error:', err)
  res.status(500).json({ error: 'Unexpected server error.' })
})

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Guitool tabs-server listening on :${PORT}, serving ${TABS_DIR}`)
  })
}

module.exports = { app, storage }
