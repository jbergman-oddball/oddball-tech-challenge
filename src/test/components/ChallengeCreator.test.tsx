import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChallengeCreator } from '../../components/ChallengeCreator'

// Mock the auth context
vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    userRole: 'interviewer',
    trackEvent: vi.fn(),
  }),
}))

describe('ChallengeCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the challenge creator interface', () => {
    render(<ChallengeCreator />)
    
    expect(screen.getByText('AI Challenge Creator')).toBeInTheDocument()
    expect(screen.getByText('Describe Your Challenge')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Describe the challenge you want to create/)).toBeInTheDocument()
  })

  it('restricts access for non-interviewers', () => {
    vi.mocked(require('../../auth/AuthProvider').useAuth).mockReturnValue({
      user: { id: 'test-user-id' },
      userRole: 'candidate',
      trackEvent: vi.fn(),
    })

    render(<ChallengeCreator />)
    
    expect(screen.getByText('Access Restricted')).toBeInTheDocument()
    expect(screen.getByText('Only interviewers can create challenges.')).toBeInTheDocument()
  })

  it('enables generate button when prompt is entered', async () => {
    const user = userEvent.setup()
    render(<ChallengeCreator />)
    
    const textarea = screen.getByPlaceholderText(/Describe the challenge you want to create/)
    const generateButton = screen.getByText('Generate Challenge')
    
    expect(generateButton).toBeDisabled()
    
    await user.type(textarea, 'Create a React todo list component')
    
    expect(generateButton).toBeEnabled()
  })

  it('generates challenge from prompt', async () => {
    const user = userEvent.setup()
    render(<ChallengeCreator />)
    
    const textarea = screen.getByPlaceholderText(/Describe the challenge you want to create/)
    const generateButton = screen.getByText('Generate Challenge')
    
    await user.type(textarea, 'Create a React todo list component with add, delete, and mark complete functionality')
    await user.click(generateButton)
    
    expect(screen.getByText('Generating Challenge...')).toBeInTheDocument()
    
    // Wait for generation to complete
    await waitFor(() => {
      expect(screen.getByText('Generated Challenge')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('displays generated challenge details', async () => {
    const user = userEvent.setup()
    render(<ChallengeCreator />)
    
    const textarea = screen.getByPlaceholderText(/Describe the challenge you want to create/)
    await user.type(textarea, 'Create a React todo list component')
    await user.click(screen.getByText('Generate Challenge'))
    
    await waitFor(() => {
      expect(screen.getByText('Generated Challenge')).toBeInTheDocument()
      expect(screen.getByText('Save Challenge')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('resets form when reset button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChallengeCreator />)
    
    const textarea = screen.getByPlaceholderText(/Describe the challenge you want to create/)
    await user.type(textarea, 'Test prompt')
    await user.click(screen.getByText('Generate Challenge'))
    
    await waitFor(() => {
      expect(screen.getByText('Reset')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    await user.click(screen.getByText('Reset'))
    
    expect(textarea).toHaveValue('')
    expect(screen.queryByText('Generated Challenge')).not.toBeInTheDocument()
  })

  it('shows error for empty prompt', async () => {
    const user = userEvent.setup()
    render(<ChallengeCreator />)
    
    const generateButton = screen.getByText('Generate Challenge')
    await user.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please provide information about the challenge you want to create')).toBeInTheDocument()
    })
  })

  it('parses different difficulty levels from prompts', async () => {
    const user = userEvent.setup()
    render(<ChallengeCreator />)
    
    const textarea = screen.getByPlaceholderText(/Describe the challenge you want to create/)
    
    // Test beginner difficulty
    await user.clear(textarea)
    await user.type(textarea, 'Create a simple beginner React component')
    await user.click(screen.getByText('Generate Challenge'))
    
    await waitFor(() => {
      expect(screen.getByText('Beginner')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('categorizes challenges correctly', async () => {
    const user = userEvent.setup()
    render(<ChallengeCreator />)
    
    const textarea = screen.getByPlaceholderText(/Describe the challenge you want to create/)
    
    await user.type(textarea, 'Create a React frontend component with state management')
    await user.click(screen.getByText('Generate Challenge'))
    
    await waitFor(() => {
      expect(screen.getByText('Frontend Development')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})