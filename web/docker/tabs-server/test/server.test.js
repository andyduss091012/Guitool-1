const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

// Env vars must be set before requiring server.js — TABS_DIR/PORT are read
// once at module load.
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'guitool-tabs-server-'))
process.env.TABS_DIR = TMP
process.env.ADMIN_IMPORT_TOKEN = 'test-token'
process.env.PORT = '0'

const request = require('supertest')
const { app } = require('../server')

test('existing frontend flow: a flat file dropped in TABS_DIR is still listed and downloadable', async () => {
  fs.writeFileSync(path.join(TMP, 'Song.gp5'), Buffer.from('legacy-bytes'))
  const list = await request(app).get('/api/tabs').expect(200)
  assert.ok(list.body.files.some((f) => f.name === 'Song.gp5'))
  // The new `tabs` key is additive — existing clients only ever read `files`.
  assert.ok(Array.isArray(list.body.tabs))

  const download = await request(app).get('/api/tabs/Song.gp5').expect(200)
  assert.equal(download.text, 'legacy-bytes')
})

test('admin import: unauthenticated request is rejected', async () => {
  await request(app).post('/admin/tabs/import').expect(401)
})

test('admin import: successful import, then a repeat import reports alreadyExists', async () => {
  const fileBuf = Buffer.from('FICHIER GUITAR PRO v5.00 fake-content')

  const first = await request(app)
    .post('/admin/tabs/import')
    .set('Authorization', 'Bearer test-token')
    .field('title', 'My Song')
    .field('artist', 'Someone')
    .field('source', 'own-archive')
    .field('externalId', 'abc-123')
    .attach('file', fileBuf, 'MySong.gp5')
    .expect(201)
  assert.equal(first.body.success, true)
  assert.equal(first.body.alreadyExists, false)
  const id = first.body.tab.id

  const second = await request(app)
    .post('/admin/tabs/import')
    .set('Authorization', 'Bearer test-token')
    .field('title', 'My Song')
    .field('source', 'own-archive')
    .field('externalId', 'abc-123')
    .attach('file', fileBuf, 'MySong.gp5')
    .expect(200)
  assert.equal(second.body.alreadyExists, true)
  assert.equal(second.body.tab.id, id)

  // Exactly one stored directory for this id — no duplicate on disk.
  const dirs = fs.readdirSync(TMP, { withFileTypes: true }).filter((e) => e.isDirectory())
  assert.equal(dirs.filter((d) => d.name === id).length, 1)

  const metaResp = await request(app).get(`/api/tabs/${id}`).expect(200)
  assert.equal(metaResp.body.title, 'My Song')
  assert.ok(metaResp.body.fileUrl.includes(id))

  const fileResp = await request(app).get(`/api/tabs/${id}/file`).expect(200)
  assert.equal(fileResp.text, fileBuf.toString())
})

test('admin import: rejects an invalid source label', async () => {
  await request(app)
    .post('/admin/tabs/import')
    .set('Authorization', 'Bearer test-token')
    .field('title', 'Bad Source')
    .field('source', 'Not Valid!!')
    .attach('file', Buffer.from('x'), 'x.gp5')
    .expect(400)
})

test('admin import: rejects an unsupported file extension', async () => {
  await request(app)
    .post('/admin/tabs/import')
    .set('Authorization', 'Bearer test-token')
    .field('title', 'Bad Ext')
    .field('source', 'own-archive')
    .attach('file', Buffer.from('x'), 'x.exe')
    .expect(400)
})

test('admin import: path-traversal attempt via externalId is rejected outright', async () => {
  await request(app)
    .post('/admin/tabs/import')
    .set('Authorization', 'Bearer test-token')
    .field('title', 'Traversal Attempt')
    .field('source', 'own-archive')
    .field('externalId', '../../etc/passwd')
    .attach('file', Buffer.from('x'), 'x.gp5')
    .expect(400)
  // Belt and braces: confirm nothing landed outside TMP either way.
  assert.equal(fs.existsSync(path.join(path.dirname(TMP), 'etc', 'passwd')), false)
})

test('admin import: oversized upload is rejected with 413', async () => {
  const express = require('express')
  const multer = require('multer')
  const tinyApp = express()
  const tinyUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 } })
  tinyApp.post(
    '/upload',
    tinyUpload.single('file'),
    (req, res) => res.json({ ok: true }),
    (err, req, res, next) => {
      if (err && err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File too large.' })
        return
      }
      res.status(500).json({ error: 'unexpected' })
    },
  )
  await request(tinyApp).post('/upload').attach('file', Buffer.alloc(200, 'a'), 'big.gp5').expect(413)
})

after(() => {
  fs.rmSync(TMP, { recursive: true, force: true })
})
