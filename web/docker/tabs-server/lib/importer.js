/**
 * Core "get a tab file into shared storage" pipeline, used by both the
 * admin HTTP endpoint (`POST /admin/tabs/import` in server.js) and the CLI
 * (`cli/importTab.js`). Deliberately source-agnostic: every call here
 * takes bytes an admin already has and asserts the rights to store — see
 * the README for why this project does not include an automated
 * third-party scraper (Ultimate Guitar or otherwise) that fetches tabs by
 * URL/ID on its own.
 *
 * Every field this module writes into a tab's metadata.json is documented
 * in the README's "Storage format" section; `canCache`/`canRedistribute`/
 * `license` default to unset/false rather than being assumed true, so a
 * tab imported without an explicit rights assertion doesn't get treated
 * as freely shareable by anything reading its metadata later.
 */
const crypto = require('node:crypto')
const { detectFormat } = require('./format')

// A short, closed-vocabulary label for "where this file came from" —
// deliberately NOT a URL/domain allow-list (there's no URL-fetch path to
// guard against SSRF here), just enough structure to keep metadata
// meaningful and greppable across a shared library.
const SOURCE_LABEL_PATTERN = /^[a-z][a-z0-9-]{0,39}$/
const EXTERNAL_ID_PATTERN = /^[a-zA-Z0-9._-]{1,100}$/

class ImportValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ImportValidationError'
    this.statusCode = 400
  }
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Deterministic internal id. Prefers `source:externalId` (stable and
 * human-traceable across re-imports of the same catalog entry) so calling
 * the importer twice with the same external id is naturally idempotent;
 * falls back to the content hash when no external id is given, so two
 * uploads of the literal same file still land on the same id even then.
 */
function makeId(source, externalId, contentHash) {
  const basis = externalId ? `source:${source}:${externalId}` : `content:${contentHash}`
  return crypto.createHash('sha256').update(basis).digest('hex').slice(0, 16)
}

function validateInput(input) {
  const { file, filename, title, source, externalId, sourceUrl, license } = input
  if (!file || !Buffer.isBuffer(file) || file.length === 0) {
    throw new ImportValidationError('A non-empty tab file is required.')
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new ImportValidationError('"title" is required.')
  }
  if (!source || typeof source !== 'string' || !SOURCE_LABEL_PATTERN.test(source)) {
    throw new ImportValidationError('"source" must be a short lowercase slug (e.g. "own-archive"), starting with a letter.')
  }
  if (externalId !== undefined && !EXTERNAL_ID_PATTERN.test(externalId)) {
    throw new ImportValidationError('"externalId" may only contain letters, numbers, dot, dash, underscore.')
  }
  if (sourceUrl !== undefined && typeof sourceUrl !== 'string') {
    throw new ImportValidationError('"sourceUrl" must be a string if provided.')
  }
  if (license !== undefined && typeof license !== 'string') {
    throw new ImportValidationError('"license" must be a string if provided.')
  }
  // Throws UnsupportedFormatError (also a 4xx) on an unrecognized or
  // mismatched-looking format — filename is used for its extension only,
  // never as (or to build) a filesystem path.
  return detectFormat(filename, file)
}

async function findByContentHash(storage, contentHash, excludeId) {
  const ids = await storage.list()
  for (const id of ids) {
    if (id === excludeId) continue
    const meta = await storage.readMetadata(id)
    if (meta && meta.contentHash === contentHash) return meta
  }
  return null
}

/**
 * @param {import('./tabStorage').LocalTabStorage} storage
 * @param {{
 *   file: Buffer, filename: string, title: string, artist?: string,
 *   source: string, externalId?: string, sourceUrl?: string,
 *   license?: string, canCache?: boolean, canRedistribute?: boolean,
 * }} input
 */
async function importTab(storage, input) {
  const { format } = validateInput(input)
  const contentHash = sha256(input.file)
  const id = makeId(input.source, input.externalId, contentHash)

  // 1. External-id-derived id already on disk -> idempotent no-op (the
  //    brief's primary dedup key: "running import twice must not create
  //    duplicate files").
  const existingById = await storage.readMetadata(id)
  if (existingById) {
    return { alreadyExists: true, tab: existingById }
  }

  // 2. Same bytes already stored under a different id (no externalId that
  //    time, or a different externalId/URL pointing at the same file) ->
  //    still a duplicate.
  const existingByHash = await findByContentHash(storage, contentHash, id)
  if (existingByHash) {
    return { alreadyExists: true, tab: existingByHash }
  }

  const storedFilename = `tab.${format}`
  let saved = false
  try {
    await storage.save(id, storedFilename, input.file)
    saved = true
    const metadata = {
      id,
      title: input.title.trim(),
      artist: input.artist ? String(input.artist).trim() : undefined,
      format,
      fileName: storedFilename,
      source: input.source,
      sourceUrl: input.sourceUrl || undefined,
      externalId: input.externalId || undefined,
      contentHash,
      importedAt: new Date().toISOString(),
      license: input.license || undefined,
      canCache: input.canCache === true,
      canRedistribute: input.canRedistribute === true,
    }
    await storage.writeMetadata(id, metadata)
    return { alreadyExists: false, tab: metadata }
  } catch (err) {
    // Keep file-write and metadata-write as close to atomic as a plain
    // filesystem allows: if metadata fails to write after the file itself
    // was saved, don't leave an orphaned file with no record behind.
    if (saved) {
      await storage.delete(id).catch(() => {})
    }
    throw err
  }
}

module.exports = { importTab, sha256, makeId, findByContentHash, ImportValidationError, SOURCE_LABEL_PATTERN, EXTERNAL_ID_PATTERN }
