/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import StatsGrid from '@/components/StatsGrid'
import type { PlayerStats } from '@/lib/types'

const stats: PlayerStats = {
  games_played: 42,
  avg_placement: 3.82,
  first_place_pct: 14.29,
  avg_rating_delta: 12.5,
  peak_rating: 9200,
  current_rating: 8900,
  current_rank: 15,
}

describe('StatsGrid', () => {
  it('renders current rating', () => {
    render(<StatsGrid stats={stats} />)
    expect(screen.getByText('8900')).toBeInTheDocument()
    expect(screen.getByText('Rating')).toBeInTheDocument()
  })

  it('renders avg placement to 2 decimal places', () => {
    render(<StatsGrid stats={stats} />)
    expect(screen.getByText('3.82')).toBeInTheDocument()
  })

  it('renders first place pct to 1 decimal with % sign', () => {
    render(<StatsGrid stats={stats} />)
    expect(screen.getByText('14.3%')).toBeInTheDocument()
  })

  it('renders positive avg delta with + sign', () => {
    render(<StatsGrid stats={stats} />)
    expect(screen.getByText('+12.5')).toBeInTheDocument()
  })

  it('falls back to peak_rating when current_rating is null', () => {
    render(<StatsGrid stats={{ ...stats, current_rating: null }} />)
    expect(screen.getByText('9200')).toBeInTheDocument()
  })
})
