import { Router } from 'express'
import { createApplicantsStatisticsController } from '../controllers/applicantsStatisticsController.js'
import { getHealth } from '../controllers/healthController.js'
import { createManualEditsGetController, createManualEditsPutController } from '../controllers/manualEditsController.js'
import { getReport } from '../controllers/reportController.js'
import type { ServerEnvironment } from '../types/environment.js'

export function createApiRouter(env: ServerEnvironment): Router {
  const router = Router()

  router.get('/health', getHealth)
  router.get('/report-2025-2026', getReport)
  router.get('/applicants-statistics', createApplicantsStatisticsController(env))
  router.get('/manual-edits', createManualEditsGetController(env))
  router.put('/manual-edits', createManualEditsPutController(env))

  return router
}
