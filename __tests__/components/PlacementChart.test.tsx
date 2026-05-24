/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import PlacementChart from '@/components/PlacementChart'
import type { PlacementDistributionRow } from '@/lib/types'

jest.mock('recharts', () => {
  const Recharts = jest.requireActual('recharts')
  return {
    ...Recharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }
})

const sampleData: PlacementDistributionRow[] = [
  { placement: 1, count: 5 },
  { placement: 2, count: 8 },
  { placement: 4, count: 12 },
]

describe('PlacementChart', () => {
  it('shows empty state message when data is empty', () => {
    render(<PlacementChart data={[]} />)
    expect(screen.getByText('No games in this window')).toBeInTheDocument()
  })

  it('does not show empty state when data is provided', () => {
    render(<PlacementChart data={sampleData} />)
    expect(screen.queryByText('No games in this window')).not.toBeInTheDocument()
  })
})
