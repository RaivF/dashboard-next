import type { RequestHandler } from 'express'
import { readManualEdits, writeManualEdits } from '../services/manualEditsService.js'
import type { ServerEnvironment } from '../types/environment.js'
import { rootDir } from '../utils/paths.js'

export function createManualEditsGetController(env: ServerEnvironment): RequestHandler {
  return async (_req, res, next) => {
    try {
      res.json(await readManualEdits(rootDir, env))
    } catch (error) {
      next(error)
    }
  }
}

export function createManualEditsPutController(env: ServerEnvironment): RequestHandler {
  return async (req, res, next) => {
    try {
      res.json(await writeManualEdits(rootDir, req.body, env))
    } catch (error) {
      next(error)
    }
  }
}
