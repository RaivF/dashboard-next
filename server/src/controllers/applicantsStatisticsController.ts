import type { RequestHandler } from 'express'
import { getApplicantsStatistics } from '../services/applicantsStatisticsService.js'
import type { ServerEnvironment } from '../types/environment.js'
import { rootDir } from '../utils/paths.js'
import { normalizePeriod } from '../validators/period.js'

export function createApplicantsStatisticsController(env: ServerEnvironment): RequestHandler {
  return (req, res, next) => {
    try {
      const selectedPeriod = normalizePeriod(req.query.period)
      res.json(getApplicantsStatistics(selectedPeriod, rootDir, env))
    } catch (error) {
      next(error)
    }
  }
}
