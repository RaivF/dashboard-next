// Final admission figures shown on the 2025/2026 academic-year results page.
const budget = 4_167
const total = 6_087

export const ADMISSION_RESULTS_2025 = {
  budget,
  total,
  paid: total - budget,
} as const
