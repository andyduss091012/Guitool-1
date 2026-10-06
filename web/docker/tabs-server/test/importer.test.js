const { test } = require('node:test')
const assert = require('node:assert/strict')
const os = require('node:os')
const fs = require('node:fs')
const path = require('node:path')

const { LocalTabStorage } = require('../lib/tabStorage')
const { importTab, makeId, ImportValidationError } = require('../lib/importer')
const { UnsupportedFormatError } = require('../lib/format')

function tmpStorage() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guitool-importer-'))
  return { dir, storage: new LocalTabStorage(dir) }
}

test('makeId never contains path-unsafe characters, whatever the externalId looks like', () => {
  const id = makeId('own-archive', '../../etc/passwd', 'deadbeef')
  assert.match(id, /^[0-9a-f]{16}$/)
})

test('successful import writes exactly one tab file + one metadata.json, rights unset by default', async () => {
  const { dir, storage } = tmpStorage()
  const result = await importTab(storage, {
    file: Buffer.from('FICHIER GUITAR PRO v5.00'),
    filename: 'Song.gp5',
    title: 'Song',
    source: 'own-archive',
    externalId: 'ext-1',
  })
  assert.equal(result.alreadyExists, false)
  const tabDir = path.join(dir, result.tab.id)
  assert.ok(fs.existsSync(path.join(tabDir, 'tab.gp5')))
  assert.ok(fs.existsSync(path.join(tabDir, 'metadata.json')))
  const onDisk = JSON.parse(fs.readFileSync(path.join(tabDir, 'metadata.json'), 'utf8'))
  // Rights are never assumed just because a file was uploaded — an admin
  // has to explicitly assert canCache/canRedistribute.
  assert.equal(onDisk.canCache, false)
  assert.equal(onDisk.canRedistribute, false)
})

test('importing the same tab twice by externalId produces exactly one stored directory (idempotent)', async () => {
  const { dir, storage } = tmpStorage()
  const input = {
    file: Buffer.from('same-bytes-twice'),
    filename: 'A.gp5',
    title: 'A',
    source: 'own-archive',
    externalId: 'dup-1',
  }
  const first = await importTab(storage, input)
  const second = await importTab(storage, input)
  assert.equal(first.tab.id, second.tab.id)
  assert.equal(second.alreadyExists, true)
  const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory())
  assert.equal(entries.length, 1)
})

test('duplicate content hash under a different externalId is caught (no shared id required)', async () => {
  const { storage } = tmpStorage()
  const bytes = Buffer.from('identical-bytes-different-ids')
  const first = await importTab(storage, { file: bytes, filename: 'A.gp5', title: 'A', source: 'own-archive', externalId: 'id-a' })
  const second = await importTab(storage, { file: bytes, filename: 'B.gp5', title: 'B', source: 'own-archive', externalId: 'id-b' })
  assert.equal(second.alreadyExists, true)
  assert.equal(second.tab.id, first.tab.id)
})

test('rejects an invalid source label', async () => {
  const { storage } = tmpStorage()
  await assert.rejects(
    importTab(storage, { file: Buffer.from('x'), filename: 'a.gp5', title: 'A', source: 'Not Valid!!' }),
    ImportValidationError,
  )
})

test('rejects an unsupported file extension', async () => {
  const { storage } = tmpStorage()
  await assert.rejects(
    importTab(storage, { file: Buffer.from('x'), filename: 'a.exe', title: 'A', source: 'own-archive' }),
    UnsupportedFormatError,
  )
})

test('rejects a .gpx whose bytes are not actually a zip', async () => {
  const { storage } = tmpStorage()
  await assert.rejects(
    importTab(storage, { file: Buffer.from('not a zip'), filename: 'a.gpx', title: 'A', source: 'own-archive' }),
    UnsupportedFormatError,
  )
})

test('storage failure during save: rejects, and never attempts to write metadata', async () => {
  const failingStorage = {
    async readMetadata() {
      return null
    },
    async list() {
      return []
    },
    async save() {
      throw new Error('disk full')
    },
    async delete() {},
    async writeMetadata() {
      throw new Error('should not be called')
    },
  }
  await assert.rejects(
    importTab(failingStorage, { file: Buffer.from('x'), filename: 'a.gp5', title: 'A', source: 'own-archive' }),
    /disk full/,
  )
})

test('metadata-write failure after a successful save rolls back the saved file (no orphan)', async () => {
  let deleted = false
  let savedId = null
  const flakyStorage = {
    async readMetadata() {
      return null
    },
    async list() {
      return []
    },
    async save(id) {
      savedId = id
      return `/fake/${id}`
    },
    async writeMetadata() {
      throw new Error('metadata store unavailable')
    },
    async delete(id) {
      if (id === savedId) deleted = true
    },
  }
  await assert.rejects(
    importTab(flakyStorage, { file: Buffer.from('x'), filename: 'a.gp5', title: 'A', source: 'own-archive' }),
    /metadata store unavailable/,
  )
  assert.equal(deleted, true)
})
