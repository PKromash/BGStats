/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import NavBar from '@/components/NavBar'

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('NavBar', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockFetch.mockClear()
    mockPush.mockClear()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the BGStats link and search input', () => {
    render(<NavBar />)
    expect(screen.getByRole('link', { name: 'BGStats' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search players...')).toBeInTheDocument()
  })

  it('fetches and shows results after 300ms debounce', async () => {
    mockFetch.mockResolvedValue({
      json: async () => [
        { id: 1, player_name: 'trumpsc', last_seen_at: '2024-01-01' },
      ],
    })
    render(<NavBar />)
    fireEvent.change(screen.getByPlaceholderText('Search players...'), {
      target: { value: 'trump' },
    })
    act(() => { jest.advanceTimersByTime(300) })
    await waitFor(() => {
      expect(screen.getByText('trumpsc')).toBeInTheDocument()
    })
  })

  it('navigates to player profile when a result is clicked', async () => {
    mockFetch.mockResolvedValue({
      json: async () => [
        { id: 1, player_name: 'trumpsc', last_seen_at: '2024-01-01' },
      ],
    })
    render(<NavBar />)
    fireEvent.change(screen.getByPlaceholderText('Search players...'), {
      target: { value: 'trump' },
    })
    act(() => { jest.advanceTimersByTime(300) })
    await waitFor(() => {
      fireEvent.click(screen.getByText('trumpsc'))
    })
    expect(mockPush).toHaveBeenCalledWith('/players/trumpsc')
  })

  it('hides dropdown when query is empty', () => {
    render(<NavBar />)
    const input = screen.getByPlaceholderText('Search players...')
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
