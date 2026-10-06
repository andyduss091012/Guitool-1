/**
 * TabStorage — the storage abstraction admin-imported tabs are read/written
 * through, so the *importer* and the *API routes* never talk to the
 * filesystem directly. Today only `LocalTabStorage` exists (a folder on
 * disk, one subdirectory per tab id), but the interface is written so a
 * later `ObjectTabStorage` (S3 / Azure Blob / a network filesystem share)
 * can be swapped in without touching `lib/importer.js` or `server.js` —
 * see the README's "Shared storage" section for why that matters (a
 * Docker volume on one host does NOT sync to another host/user).
 *
 * Contract (every implementation must satisfy this):
 *   exists(id)              -> Promise<boolean>
 *   save(id, filename, buf)  -> Promise<string>   // returns a path/key, informational only
 *   read(id, filename)      -> Promise<Buffer>
 *   delete(id)               -> Promise<void>      // removes everything stored under this id
 *   list()                   -> Promise<string[]>  // every id currently stored (for the /api/tabs listing and dedup scans)
 *   readMetadata(id)         -> Promise<object|null>
 *   writeMetadata(id, meta) -> Promise<void>
 *
 * `readMetadata`/`writeMetadata` are convenience helpers on top of
 * save/read (metadata.json is just another file "in" the tab's id), kept
 * on the interface because every consumer needs them and re-implementing
 * JSON-parse-or-null in three places isn't worth avoiding a couple of
 * extra interface methods.
 */
const fs = require('node:fs/promises')
const path = require('node:path')

const METADATA_FILE = 'metadata.json'

class LocalTabStorage {
  constructor(rootDir) {
    this.rootDir = rootDir
  }

  _dir(id) {
    return path.join(this.rootDir, id)
  }

  async exists(id) {
    try {
      await fs.access(this._dir(id))
      return true
    } catch {
      return false
    }
  }

  async save(id, filename, data) {
    const dir = this._dir(id)
    await fs.mkdir(dir, { recursive: true })
    const filePath = path.join(dir, filename)
    await fs.writeFile(filePath, data)
    return filePath
  }

  async read(id, filename) {
    return fs.readFile(path.join(this._dir(id), filename))
  }

  async delete(id) {
    await fs.rm(this._dir(id), { recursive: true, force: true })
  }

  async list() {
    try {
      const entries = await fs.readdir(this.rootDir, { withFileTypes: true })
      return entries.filter((e) => e.isDirectory()).map((e) => e.name)
    } catch (err) {
      if (err && err.code === 'ENOENT') return []
      throw err
    }
  }

  async readMetadata(id) {
    try {
      const raw = await fs.readFile(path.join(this._dir(id), METADATA_FILE), 'utf8')
      return JSON.parse(raw)
    } catch (err) {
      if (err && err.code === 'ENOENT') return null
      throw err
    }
  }

  async writeMetadata(id, metadata) {
    const dir = this._dir(id)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, METADATA_FILE), JSON.stringify(metadata, null, 2))
  }
}

module.exports = { LocalTabStorage, METADATA_FILE }
