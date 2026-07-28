import { apiGet } from '../../../shared/api/httpClient.js'

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

export async function getCompetitionGroupsDemand(
  campaignYear: number,
  signal?: AbortSignal,
): Promise<CompetitionGroupsDemand> {
  return apiGet<CompetitionGroupsDemand>('/api/competition-groups-demand', {
    params: {
      campaign_year: campaignYear,
    },
    signal,
    timeout: 30_000,
  })
}
