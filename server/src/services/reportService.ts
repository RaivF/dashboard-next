import { buildReport20252026Response } from './reportData.js'
import { loadUgsnInfoTable, loadUgsnInfoWorkbook } from '../clients/ugsnInfoData.js'
import { rootDir } from '../utils/paths.js'

export function getReport20252026() {
  return {
    ...buildReport20252026Response(),
    ugsnInfo: loadUgsnInfoTable(rootDir),
    ugsnWorkbook: loadUgsnInfoWorkbook(rootDir),
  }
}
