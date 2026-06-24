import { CHART_COLORS } from './chartConfig.js'

export type NamedQuantity = {
  name: string
  quantity: number
}

export function buildBarComparisonData(data: NamedQuantity[], previousYearData: NamedQuantity[]) {
  const currentByName = new Map(data.map((item) => [item.name, item.quantity]))
  const previousByName = new Map(previousYearData.map((item) => [item.name, item.quantity]))
  const names = [
    ...data.map((item) => item.name),
    ...previousYearData.map((item) => item.name).filter((name) => !currentByName.has(name)),
  ]

  return names.map((name) => ({
    name,
    quantity: currentByName.get(name) || 0,
    previousYearQuantity: previousByName.get(name) || 0,
  }))
}

export function buildDonutRows(
  data: NamedQuantity[],
  previousYearData: NamedQuantity[],
  includePreviousYear: boolean,
) {
  const currentByName = new Map(data.map((item) => [item.name, item.quantity]))
  const previousByName = new Map(previousYearData.map((item) => [item.name, item.quantity]))
  const categoryNames = [
    ...data.map((item) => item.name),
    ...previousYearData.map((item) => item.name).filter((name) => !currentByName.has(name)),
  ]
  const currentTotal = data.reduce((sum, item) => sum + item.quantity, 0)
  const previousTotal = previousYearData.reduce((sum, item) => sum + item.quantity, 0)

  return categoryNames.map((name, index) => {
    const currentQuantity = currentByName.get(name) || 0
    const previousQuantity = includePreviousYear ? previousByName.get(name) || 0 : 0

    return {
      name,
      color: CHART_COLORS[index % CHART_COLORS.length],
      currentQuantity,
      currentPercent: currentTotal ? (currentQuantity / currentTotal) * 100 : 0,
      previousQuantity,
      previousPercent: previousTotal ? (previousQuantity / previousTotal) * 100 : 0,
    }
  })
}
