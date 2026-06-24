import { useEffect, useState } from 'react'
import { RANGE_OPTIONS, clampCampaignYear } from './periodConfig.js'

function getDefaultPeriod() {
  const savedPeriod = localStorage.getItem('dashboard-period') || '2025-01'
  const savedYear = Number.parseInt(String(savedPeriod).slice(0, 4), 10)
  return toCampaignPeriod(clampCampaignYear(savedYear))
}

function getCampaignYear(periodValue) {
  const fallbackYear = new Date().getFullYear()
  const year = Number.parseInt(String(periodValue || '').slice(0, 4), 10)
  return clampCampaignYear(Number.isFinite(year) ? year : fallbackYear)
}

function toCampaignPeriod(year) {
  return `${year}-01`
}

function getDefaultRange() {
  const savedRange = localStorage.getItem('dashboard-range')
  return RANGE_OPTIONS.some((option) => option.value === savedRange) ? savedRange : 'actual'
}

function getDefaultSelectedDate() {
  return null
}

function getDefaultPreviousYearOverlay() {
  return localStorage.getItem('dashboard-previous-year-overlay') !== 'false'
}

function getDefaultPreviousYearFunding() {
  return localStorage.getItem('dashboard-previous-year-funding') !== 'false'
}

function getDefaultPreviousYearForm() {
  return localStorage.getItem('dashboard-previous-year-form') === 'true'
}

function getDefaultPreviousYearMethod() {
  return localStorage.getItem('dashboard-previous-year-method') === 'true'
}

export function useDashboardSettings() {
  const [period, setPeriod] = useState(getDefaultPeriod)
  const [range, setRange] = useState(getDefaultRange)
  const [selectedDate, setSelectedDate] = useState(getDefaultSelectedDate)
  const [showPreviousYearOverlay, setShowPreviousYearOverlay] = useState(getDefaultPreviousYearOverlay)
  const [showPreviousYearFunding, setShowPreviousYearFunding] = useState(getDefaultPreviousYearFunding)
  const [showPreviousYearForm, setShowPreviousYearForm] = useState(getDefaultPreviousYearForm)
  const [showPreviousYearMethod, setShowPreviousYearMethod] = useState(getDefaultPreviousYearMethod)
  const campaignYear = getCampaignYear(period)

  useEffect(() => {
    localStorage.setItem('dashboard-range', range)
  }, [range])

  useEffect(() => {
    localStorage.removeItem('dashboard-selected-date')
  }, [])

  useEffect(() => {
    localStorage.setItem('dashboard-previous-year-overlay', String(showPreviousYearOverlay))
  }, [showPreviousYearOverlay])

  useEffect(() => {
    localStorage.setItem('dashboard-previous-year-funding', String(showPreviousYearFunding))
  }, [showPreviousYearFunding])

  useEffect(() => {
    localStorage.setItem('dashboard-previous-year-form', String(showPreviousYearForm))
  }, [showPreviousYearForm])

  useEffect(() => {
    localStorage.setItem('dashboard-previous-year-method', String(showPreviousYearMethod))
  }, [showPreviousYearMethod])

  const setCampaignYear = (nextYear) => {
    const safeYear = clampCampaignYear(nextYear)
    setPeriod(toCampaignPeriod(safeYear))
    setSelectedDate(null)
  }

  return {
    period,
    range,
    setRange,
    selectedDate,
    setSelectedDate,
    showPreviousYearOverlay,
    setShowPreviousYearOverlay,
    showPreviousYearFunding,
    setShowPreviousYearFunding,
    showPreviousYearForm,
    setShowPreviousYearForm,
    showPreviousYearMethod,
    setShowPreviousYearMethod,
    campaignYear,
    setCampaignYear,
  }
}
