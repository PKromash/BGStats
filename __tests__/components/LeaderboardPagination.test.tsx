/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import LeaderboardPagination from '@/components/LeaderboardPagination'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('LeaderboardPagination', () => {
  beforeEach(() => mockPush.mockClear())

  it('renders Prev, Next buttons and page info', () => {
    render(<LeaderboardPagination currentPage={2} totalPages={5} />)
    expect(screen.getByRole('button', { name: /prev/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()
  })

  it('disables Prev on page 1', () => {
    render(<LeaderboardPagination currentPage={1} totalPages={5} />)
    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled()
  })

  it('disables Next on last page', () => {
    render(<LeaderboardPagination currentPage={5} totalPages={5} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('navigates to next page when Next is clicked', () => {
    render(<LeaderboardPagination currentPage={2} totalPages={5} />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(mockPush).toHaveBeenCalledWith('/?page=3')
  })

  it('navigates to prev page when Prev is clicked', () => {
    render(<LeaderboardPagination currentPage={3} totalPages={5} />)
    fireEvent.click(screen.getByRole('button', { name: /prev/i }))
    expect(mockPush).toHaveBeenCalledWith('/?page=2')
  })

  it('navigates to / (no param) when going from page 2 to page 1', () => {
    render(<LeaderboardPagination currentPage={2} totalPages={5} />)
    fireEvent.click(screen.getByRole('button', { name: /prev/i }))
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('submits go-to-page form and navigates', () => {
    render(<LeaderboardPagination currentPage={1} totalPages={10} />)
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '5' } })
    fireEvent.submit(input.closest('form')!)
    expect(mockPush).toHaveBeenCalledWith('/?page=5')
  })
})
