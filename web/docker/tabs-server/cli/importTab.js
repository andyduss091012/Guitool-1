#!/usr/bin/env node
/**
 * CLI for importing a tab file an admin already has into the shared
 * storage folder tabs-server serves — the offline counterpart to
 * `POST /admin/tabs/import`, useful when TABS_DIR is directly reachable
 * (run on the host, or via `docker compose exec tabs-server ...`) without
 * needing the HTTP server up or an admin token in hand.
 *
 * Usage:
 *   npm run import:tab -- --file ./MySong.gp5 --title "My Song" --source own-archive \
 *     [--artist "Someone"] [--source-url "..."] [--external-id "..."] \
 *     [--license "..."] [--can-cache] [--can-redistribute]
 */
const fs = require('node:fs')
const path = require('node:path')
const { LocalTabStorage } = require('../lib/tabStorage')
const { importTab, ImportValidationError } = require('../lib/importer')
const { UnsupportedFormatError } = require('../lib/format')

const BOOL_FLAGS = ['can-cache', 'can-redistribute']

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    if (BOOL_FLAGS.includes(key)) {
      args[key] = true
      continue
    }
    args[key] = argv[i + 1]
    i += 1
  }
  return args
}

function printUsage() {
  console.error(
    'Usage: import:tab -- --file <path> --title "<title>" --source <slug> ' +
      '[--artist "<artist>"] [--source-url "<url>"] [--external-id "<id>"] ' +
      '[--license "<license>"] [--can-cache] [--can-redistribute]',
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.file || !args.title || !args.source) {
    printUsage()
    process.exitCode = 1
    return
  }

  const filePath = path.resolve(args.file)
  let buffer
  try {
    buffer = fs.readFileSync(filePath)
  } catch (err) {
    console.error(`Could not read ${filePath}: ${err.message}`)
    process.exitCode = 1
    return
  }

  const TABS_DIR = process.env.TABS_DIR || '/data/tabs'
  const storage = new LocalTabStorage(TABS_DIR)

  console.log('Fetching tab...')
  console.log(`Source: ${args.source}`)
  if (args['external-id']) console.log(`External ID: ${args['external-id']}`)
  console.log('')
  console.log(`Title: ${args.title}`)
  if (args.artist) console.log(`Artist: ${args.artist}`)

  try {
    const result = await importTab(storage, {
      file: buffer,
      filename: path.basename(filePath),
      title: args.title,
      artist: args.artist,
      source: args.source,
      externalId: args['external-id'],
      sourceUrl: args['source-url'],
      license: args.license,
      canCache: Boolean(args['can-cache']),
      canRedistribute: Boolean(args['can-redistribute']),
    })

    console.log(`Format: ${result.tab.format}`)
    console.log('')

    if (result.alreadyExists) {
      console.log('Checking existing tabs...')
      console.log('Tab already exists.')
      console.log('Skipping download.')
      console.log(`  id: ${result.tab.id}`)
      return
    }

    console.log('Checking existing tabs...')
    console.log('No duplicate found.')
    console.log('')
    console.log('Saving:')
    console.log(`  ${TABS_DIR}/${result.tab.id}/${result.tab.fileName}`)
    console.log('Saving metadata:')
    console.log(`  ${TABS_DIR}/${result.tab.id}/metadata.json`)
    console.log('')
    console.log('Import complete.')
  } catch (err) {
    if (err instanceof ImportValidationError || err instanceof UnsupportedFormatError) {
      console.error(`Import failed: ${err.message}`)
      process.exitCode = 1
      return
    }
    throw err
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
