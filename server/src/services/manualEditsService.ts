import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ServerEnvironment } from '../types/environment.js'

export type ManualEditEntry = {
  text: string
  updatedAt: string
}

export type ManualEditsStore = {
  version: 1
  pages: Record<string, Record<string, ManualEditEntry>>
}

const DEFAULT_MANUAL_EDITS_FILE = path.join('DATA', 'manual-edits', 'page-overrides.json')

export function createEmptyManualEditsStore(): ManualEditsStore {
  return {
    version: 1,
    pages: {},
  }
}

function getManualEditsPath(rootDir: string, env: ServerEnvironment = process.env): string {
  return env.MANUAL_EDITS_FILE
    ? path.resolve(rootDir, env.MANUAL_EDITS_FILE)
    : path.join(rootDir, DEFAULT_MANUAL_EDITS_FILE)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeManualEditsStore(value: unknown): ManualEditsStore {
  if (!isRecord(value) || !isRecord(value.pages)) {
    return createEmptyManualEditsStore()
  }

  const pages: ManualEditsStore['pages'] = {}

  Object.entries(value.pages).forEach(([pageKey, pageValue]) => {
    if (!isRecord(pageValue)) return

    const pageEntries: Record<string, ManualEditEntry> = {}

    Object.entries(pageValue).forEach(([selector, editValue]) => {
      if (!isRecord(editValue) || typeof editValue.text !== 'string') return

      pageEntries[selector] = {
        text: editValue.text,
        updatedAt: typeof editValue.updatedAt === 'string' ? editValue.updatedAt : new Date().toISOString(),
      }
    })

    pages[pageKey] = pageEntries
  })

  return {
    version: 1,
    pages,
  }
}

export async function readManualEdits(
  rootDir: string,
  env: ServerEnvironment = process.env,
): Promise<ManualEditsStore> {
  const filePath = getManualEditsPath(rootDir, env)

  try {
    const raw = await readFile(filePath, 'utf8')
    return normalizeManualEditsStore(JSON.parse(raw))
  } catch (error) {
    const code = (error as { code?: string })?.code
    if (code === 'ENOENT') return createEmptyManualEditsStore()
    throw error
  }
}

export async function writeManualEdits(
  rootDir: string,
  store: unknown,
  env: ServerEnvironment = process.env,
): Promise<ManualEditsStore> {
  const filePath = getManualEditsPath(rootDir, env)
  const normalizedStore = normalizeManualEditsStore(store)

  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(normalizedStore, null, 2)}\n`, 'utf8')

  return normalizedStore
}
