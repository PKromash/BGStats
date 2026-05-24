/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import WindowSelector from '@/components/WindowSelector'

const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('WindowSelector', () => {
  beforeEach(() => mockReplace.mockClear())

  it('renders three buttons: 7d, 30d, Season', () => {
    render(<WindowSelector current="season" />)
    expect(screen.getByText('7d')).toBeInTheDocument()
    expect(screen.getByText('30d')).toBeInTheDocument()
    expect(screen.getByText('Season')).toBeInTheDocument()
  })

  it('highlights the active window button', () => {
    render(<WindowSelector current="7d" />)
    expect(screen.getByText('7d')).toHaveClass('bg-blue-600')
    expect(screen.getByText('30d')).not.toHaveClass('bg-blue-600')
  })

  it('calls router.replace with ?window=7d when 7d is clicked', () => {
    render(<WindowSelector current="season" />)
    fireEvent.click(screen.getByText('7d'))
    expect(mockReplace).toHaveBeenCalledWith('?window=7d')
  })

  it('calls router.replace with ?window=season when Season is clicked', () => {
    render(<WindowSelector current="7d" />)
    fireEvent.click(screen.getByText('Season'))
    expect(mockReplace).toHaveBeenCalledWith('?window=season')
  })
})
