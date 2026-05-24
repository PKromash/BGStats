/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import RatingHistoryChart from '@/components/RatingHistoryChart'
import type { GameHistoryRow } from '@/lib/types'

jest.mock('recharts', () => {
  const Recharts = jest.requireActual('recharts')
  return {
    ...Recharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }
})

const sampleHistory: GameHistoryRow[] = [
  {
    observed_at: '2024-01-10T12:00:00Z',
    rating_before: 8800,
    rating_after: 8850,
    rating_delta: 50,
    estimated_placement: 2,
  },
  {
    observed_at: '2024-01-11T12:00:00Z',
    rating_before: 8850,
    rating_after: 8900,
    rating_delta: 50,
    estimated_placement: 1,
  },
]

describe('RatingHistoryChart', () => {
  it('shows empty state message when data is empty', () => {
    render(<RatingHistoryChart data={[]} />)
    expect(screen.getByText('No game history')).toBeInTheDocument()
  })

  it('does not show empty state when data is provided', () => {
    render(<RatingHistoryChart data={sampleHistory} />)
    expect(screen.queryByText('No game history')).not.toBeInTheDocument()
  })
})
