import axios from 'axios'
import { AppError } from '../middlewares/errorHandler.js'
import type { ServerEnvironment } from '../types/environment.js'

const DEMAND_API_URL = 'https://lk-abit.melsu.ru/api/v1/integrations/competition-groups/demand'
const MELSU_KCP_PLAN = 3128
const CACHE_TTL_MS = 60_000

type CompetitionGroupDemandItem = {
  applications_backup?: unknown
  applications_backup_consent?: unknown
  applications_primary?: unknown
  applications_primary_consent?: unknown
  applications_total?: unknown
  applications_total_consent?: unknown
  competition_group_id?: unknown
  department_label?: unknown
  kcp?: unknown
  speciality_code?: unknown
  speciality_name?: unknown
}

type CompetitionGroupsDemandApiResponse = {
  campaign_year?: unknown
  items?: unknown
  snapshot_at?: unknown
}

export type CompetitionGroupsDemandDirection = {
  applicationsBackup: number
  applicationsBackupConsent: number
  applicationsPrimary: number
  applicationsPrimaryConsent: number
  applicationsTotal: number
  applicationsTotalConsent: number
  code: string
  current: number
  fillPercent: number
  name: string
  overflow: number
  percent: number
  plan: number
  remaining: number
}

export type CompetitionGroupsDemand = {
  campaignYear: number
  current: number
  directions: CompetitionGroupsDemandDirection[]
  fillPercent: number
  hasPlan: boolean
  overflow: number
  percent: number
  plan: number
  remaining: number
  snapshotAt: string | null
}

type CacheEntry = {
  expiresAt: number
  value: CompetitionGroupsDemand
}

const cache = new Map<number, CacheEntry>()

function numberValue(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isMainUniversityItem(item: CompetitionGroupDemandItem): boolean {
  return !textValue(item.department_label)
}

export function normalizeCompetitionGroupsDemand(
  source: CompetitionGroupsDemandApiResponse,
  requestedCampaignYear: number,
): CompetitionGroupsDemand {
  const items = Array.isArray(source.items)
    ? source.items.filter((item): item is CompetitionGroupDemandItem => typeof item === 'object' && item !== null)
    : []
  const directionsBySpeciality = new Map<string, Omit<CompetitionGroupsDemandDirection, 'fillPercent' | 'overflow' | 'percent' | 'remaining'>>()

  items.filter(isMainUniversityItem).forEach((item) => {
    const code = textValue(item.speciality_code)
    const name = textValue(item.speciality_name)
    const key = `${code}::${name}`

    if (!name) return

    const direction = directionsBySpeciality.get(key) || {
      code,
      name,
      plan: 0,
      current: 0,
      applicationsPrimary: 0,
      applicationsBackup: 0,
      applicationsTotal: 0,
      applicationsPrimaryConsent: 0,
      applicationsBackupConsent: 0,
      applicationsTotalConsent: 0,
    }

    direction.plan += numberValue(item.kcp)
    // У поступающего может быть несколько заявлений, но только один первый приоритет.
    // Для КЦП учитываем первого приоритета только с поданным согласием.
    direction.current += numberValue(item.applications_primary_consent)
    direction.applicationsPrimary += numberValue(item.applications_primary)
    direction.applicationsBackup += numberValue(item.applications_backup)
    direction.applicationsTotal += numberValue(item.applications_total)
    direction.applicationsPrimaryConsent += numberValue(item.applications_primary_consent)
    direction.applicationsBackupConsent += numberValue(item.applications_backup_consent)
    direction.applicationsTotalConsent += numberValue(item.applications_total_consent)
    directionsBySpeciality.set(key, direction)
  })

  const directions = [...directionsBySpeciality.values()]
    .filter((item) => item.plan > 0)
    .map((item) => {
      const percent = item.plan ? (item.current / item.plan) * 100 : 0

      return {
        ...item,
        percent,
        fillPercent: Math.min(100, percent),
        remaining: Math.max(0, item.plan - item.current),
        overflow: Math.max(0, item.current - item.plan),
      }
    })
    .sort((a, b) => a.code.localeCompare(b.code, 'ru') || a.name.localeCompare(b.name, 'ru'))
  const current = directions.reduce((sum, item) => sum + item.current, 0)
  const percent = (current / MELSU_KCP_PLAN) * 100

  return {
    campaignYear: Number(source.campaign_year) || requestedCampaignYear,
    snapshotAt: textValue(source.snapshot_at) || null,
    plan: MELSU_KCP_PLAN,
    current,
    percent,
    fillPercent: Math.min(100, percent),
    remaining: Math.max(0, MELSU_KCP_PLAN - current),
    overflow: Math.max(0, current - MELSU_KCP_PLAN),
    hasPlan: true,
    directions,
  }
}

export async function getCompetitionGroupsDemand(
  campaignYear: number,
  env: ServerEnvironment,
): Promise<CompetitionGroupsDemand> {
  const apiKey = env.COMPETITION_GROUPS_API_KEY

  if (!apiKey) {
    throw new AppError('Competition groups API key is not configured', 503)
  }

  const cached = cache.get(campaignYear)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  try {
    const response = await axios.get<CompetitionGroupsDemandApiResponse>(DEMAND_API_URL, {
      params: { campaign_year: campaignYear },
      headers: { 'x-api-key': apiKey },
      timeout: 25_000,
    })
    const value = normalizeCompetitionGroupsDemand(response.data, campaignYear)

    cache.set(campaignYear, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })

    return value
  } catch (error) {
    console.warn('Competition groups API request failed:', error instanceof Error ? error.message : error)
    throw new AppError('Competition groups data is temporarily unavailable', 502)
  }
}
