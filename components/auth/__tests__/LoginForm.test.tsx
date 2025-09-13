import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(() => ({})),
    handleSubmit: (fn: any) => (e: any) => {
      e.preventDefault();
      fn({ username: 'testuser', password: 'testpass' });
    },
    formState: { errors: {}, isValid: true }
  })
}));

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders login form with all required fields', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByLabelText(/usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={true} />);

    expect(screen.getByText(/entrando/i)).toBeInTheDocument();
    const submitButton = screen.getByRole('button', { name: /entrando/i });
    expect(submitButton).toBeDisabled();
  });

  it('calls onSubmit with correct credentials when form is submitted', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />);

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass'
      });
    });
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />);

    const passwordInput = screen.getByLabelText(/senha/i);
    const toggleButtons = screen.getAllByRole('button');
    const toggleButton = toggleButtons.find(button => button.type === 'button' && button !== screen.getByRole('button', { name: /entrar/i }));

    expect(passwordInput).toHaveAttribute('type', 'password');

    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  it('disables form fields when loading', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={true} />);

    expect(screen.getByLabelText(/usuário/i)).toBeDisabled();
    expect(screen.getByLabelText(/senha/i)).toBeDisabled();
    const submitButton = screen.getByRole('button', { name: /entrando/i });
    expect(submitButton).toBeDisabled();
  });

  it('has proper styling classes for O Boticário brand', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />);

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    expect(submitButton).toHaveClass('bg-gradient-to-r', 'from-pink-500', 'to-purple-600');
  });
});