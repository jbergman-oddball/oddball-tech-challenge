import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthModal } from '../../components/AuthModal'
import { AuthProvider } from '../../auth/AuthProvider'

// Mock the auth context
const mockSignUp = vi.fn()
const mockSignIn = vi.fn()

vi.mock('../../auth/AuthProvider', async () => {
  const actual = await vi.importActual('../../auth/AuthProvider')
  return {
    ...actual,
    useAuth: () => ({
      signUp: mockSignUp,
      signIn: mockSignIn,
      user: null,
      loading: false,
      userRole: null,
      trackEvent: vi.fn(),
    }),
  }
})

describe('AuthModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign in form by default', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
  })

  it('switches to sign up form when clicked', async () => {
    const user = userEvent.setup()
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    await user.click(screen.getByText("Don't have an account? Sign up"))
    
    expect(screen.getByText('Create Account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    await user.click(screen.getByText('Sign In'))
    
    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument()
    })
  })

  it('validates password length', async () => {
    const user = userEvent.setup()
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Enter your password'), '123')
    await user.click(screen.getByText('Sign In'))
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument()
    })
  })

  it('calls signIn with correct parameters', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: null })
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Enter your password'), 'password123')
    await user.click(screen.getByText('Sign In'))
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('calls signUp with correct parameters', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ error: null })
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    // Switch to sign up
    await user.click(screen.getByText("Don't have an account? Sign up"))
    
    await user.type(screen.getByPlaceholderText('Enter your full name'), 'Test User')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Create a password'), 'password123')
    await user.click(screen.getByText('Create Account'))
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('displays error messages', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpassword')
    await user.click(screen.getByText('Sign In'))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<AuthModal isOpen={true} onClose={mockOnClose} />)
    
    await user.click(screen.getByRole('button', { name: /close/i }))
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('does not render when isOpen is false', () => {
    render(<AuthModal isOpen={false} onClose={mockOnClose} />)
    
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
  })
})