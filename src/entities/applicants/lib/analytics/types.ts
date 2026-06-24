export type AnalyticsRecord = Record<string, unknown>
export type AnalyticsResponse = Record<string, unknown>
export type RangeWindow = { startDate: Date | null; endDate: Date | null; hasDates?: boolean }
export type ChartRange = 'all' | 'actual' | 'day' | 'twoDays' | 'week' | 'twoWeeks' | 'month' | 'year' | string
