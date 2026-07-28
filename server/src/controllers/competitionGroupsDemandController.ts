import type { RequestHandler } from 'express'
import { getCompetitionGroupsDemand } from '../services/competitionGroupsDemandService.js'
import type { ServerEnvironment } from '../types/environment.js'

function normalizeCampaignYear(value: unknown): number {
  const year = Number(value)
  const currentYear = new Date().getUTCFullYear()

  return Number.isInteger(year) && year >= 2025 && year <= currentYear + 1 ? year : currentYear
}

export function createCompetitionGroupsDemandController(env: ServerEnvironment): RequestHandler {
  return async (req, res, next) => {
    try {
      const campaignYear = normalizeCampaignYear(req.query.campaign_year)
      const demand = await getCompetitionGroupsDemand(campaignYear, env)

      res.json(demand)
    } catch (error) {
      next(error)
    }
  }
}
