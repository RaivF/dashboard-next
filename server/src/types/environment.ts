export type ServerEnvironment = NodeJS.ProcessEnv & {
  APPLICANTS_XLSX_FILE?: string
  APPLICANTS_XLSX_SOURCE?: string
  COMPETITION_GROUPS_API_KEY?: string
  CORS_ORIGIN?: string
  NODE_ENV?: string
  PORT?: string
  PREVIOUS_YEAR_DATA_FILE?: string
}
