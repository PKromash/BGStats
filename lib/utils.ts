import type { StatsWindow } from './types'

const VALID_WINDOWS: StatsWindow[] = ['7d', '30d', 'season']

export function validateWindow(raw: string | undefined): StatsWindow {
  return VALID_WINDOWS.includes(raw as StatsWindow) ? (raw as StatsWindow) : 'season'
}
