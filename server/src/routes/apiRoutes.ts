import { Router } from 'express'
import { createApplicantsStatisticsController } from '../controllers/applicantsStatisticsController.js'
import { getHealth } from '../controllers/healthController.js'
import { getReport } from '../controllers/reportController.js'
import type { ServerEnvironment } from '../types/environment.js'

export function createApiRouter(env: ServerEnvironment): Router {
  const router = Router()

  router.get('/health', getHealth)
  router.get('/report-2025-2026', getReport)
  router.get('/applicants-statistics', createApplicantsStatisticsController(env))

  return router
}
