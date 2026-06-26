import { apiGet, httpClient } from '../../../shared/api/httpClient.js'

export type ManualEditEntry = {
  text: string
  updatedAt: string
}

export type ManualEditsStore = {
  version: 1
  pages: Record<string, Record<string, ManualEditEntry>>
}

export function createEmptyManualEditsStore(): ManualEditsStore {
  return {
    version: 1,
    pages: {},
  }
}

export async function getManualEdits(): Promise<ManualEditsStore> {
  return apiGet<ManualEditsStore>('/api/manual-edits')
}

export async function putManualEdits(store: ManualEditsStore): Promise<ManualEditsStore> {
  const response = await httpClient.put<ManualEditsStore>('/api/manual-edits', store)
  return response.data
}
