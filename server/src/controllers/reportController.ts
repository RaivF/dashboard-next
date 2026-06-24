import type { RequestHandler } from 'express'
import { getReport20252026 } from '../services/reportService.js'

export const getReport: RequestHandler = (_req, res) => {
  res.json(getReport20252026())
}
