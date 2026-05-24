/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import LeaderboardTable from '@/components/LeaderboardTable'
import type { LeaderboardRow } from '@/lib/types'

const rows: LeaderboardRow[] = [
  { rank: 1, player_name: 'trumpsc', rating: 9200, rating_delta_24h: 150 },
  { rank: 2, player_name: 'xqc', rating: 9100, rating_delta_24h: -50 },
  { rank: 3, player_name: 'pokimane', rating: 9000, rating_delta_24h: null },
]

describe('LeaderboardTable', () => {
  it('renders rank, name, rating, and delta for each row', () => {
    render(<LeaderboardTable rows={rows} />)
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('trumpsc')).toBeInTheDocument()
    expect(screen.getByText('9200')).toBeInTheDocument()
    expect(screen.getByText('+150')).toBeInTheDocument()
  })

  it('renders negative delta with red class', () => {
    render(<LeaderboardTable rows={rows} />)
    const negDelta = screen.getByText('-50')
    expect(negDelta).toHaveClass('text-red-400')
  })

  it('renders null delta as em dash', () => {
    render(<LeaderboardTable rows={rows} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('links player names to their profile pages', () => {
    render(<LeaderboardTable rows={rows} />)
    const link = screen.getByRole('link', { name: 'trumpsc' })
    expect(link).toHaveAttribute('href', '/players/trumpsc')
  })
})
