import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordResetForm } from '../PasswordResetForm';

describe('PasswordResetForm', () => {
  const mockOnRequestReset = jest.fn();
  const mockOnConfirmReset = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    mockOnRequestReset.mockClear();
    mockOnConfirmReset.mockClear();
    mockOnBack.mockClear();
  });

  describe('Request Step', () => {
    it('renders request form initially', () => {
      render(
        <PasswordResetForm
          onRequestReset={mockOnRequestReset}
          onConfirmReset={mockOnConfirmReset}
          onBack={mockOnBack}
          isLoading={false}
        />
      );

      expect(screen.getByText('Recuperar Senha')).toBeInTheDocument();
      expect(screen.getByLabelText(/usuário/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enviar código/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /voltar ao login/i })).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      render(
        <PasswordResetForm
          onRequestReset={mockOnRequestReset}
          onConfirmReset={mockOnConfirmReset}
          onBack={mockOnBack}
          isLoading={false}
        />
      );

      const submitButton = screen.getByRole('button', { name: /enviar código/i });
      
      // Button should be disabled initially
      expect(submitButton).toBeDisabled();

      // Enter invalid data
      const userIdInput = screen.getByLabelText(/usuário/i);
      await user.type(userIdInput, 'ab');

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/usuário deve ter pelo menos 3 caracteres/i)).toBeInTheDocument();
      });
    });

    it('calls onRequestReset with correct data', async () => {
      const user = userEvent.setup();
      render(
        <PasswordResetForm
          onRequestReset={mockOnRequestReset}
          onConfirmReset={mockOnConfirmReset}
          onBack={mockOnBack}
          isLoading={false}
        />
      );

      const userIdInput = screen.getByLabelText(/usuário/i);
      await user.type(userIdInput, 'testuser');

      const submitButton = screen.getByRole('button', { name: /enviar código/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnRequestReset).toHaveBeenCalledWith('testuser');
      });
    });

    it('calls onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PasswordResetForm
          onRequestReset={mockOnRequestReset}
          onConfirmReset={mockOnConfirmReset}
          onBack={mockOnBack}
          isLoading={false}
        />
      );

      const backButton = screen.getByRole('button', { name: /voltar ao login/i });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('shows loading state', () => {
      render(
        <PasswordResetForm
          onRequestReset={mockOnRequestReset}
          onConfirmReset={mockOnConfirmReset}
          onBack={mockOnBack}
          isLoading={true}
        />
      );

      expect(screen.getByText(/enviando/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/usuário/i)).toBeDisabled();
    });
  });

  describe('Confirm Step', () => {
    it('shows confirm form after successful request', async () => {
      const user = userEvent.setup();
      mockOnRequestReset.mockResolvedValue(undefined);

      render(
        <PasswordResetForm
          onRequestReset={mockOnRequestReset}
          onConfirmReset={mockOnConfirmReset}
          onBack={mockOnBack}
          isLoading={false}
        />
      );

      // Fill and submit request form
      const userIdInput = screen.getByLabelText(/usuário/i);
      await user.type(userIdInput, 'testuser');

      const submitButton = screen.getByRole('button', { name: /enviar código/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Nova Senha' })).toBeInTheDocument();
        expect(screen.getByLabelText(/código de verificação/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/digite sua nova senha/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirmar nova senha/i)).toBeInTheDocument();
      });
    });

    it('validates password confirmation', async () => {
      const user = userEvent.setup();
      mockOnRequestReset.mockResolvedValue(undefined);

      render(
        <PasswordResetForm
          onRequestReset={mockOnRequestReset}
          onConfirmReset={mockOnConfirmReset}
          onBack={mockOnBack}
          isLoading={false}
        />
      );

      // Navigate to confirm step
      const userIdInput = screen.getByLabelText(/usuário/i);
      await user.type(userIdInput, 'testuser');
      const submitButton = screen.getByRole('button', { name: /enviar código/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Nova Senha' })).toBeInTheDocument();
      });

      // Fill form with mismatched passwords
      const codeInput = screen.getByLabelText(/código de verificação/i);
      const passwordInput = screen.getByPlaceholderText(/digite sua nova senha/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar nova senha/i);

      await user.clear(codeInput);
      await user.type(codeInput, '123456');
      await user.type(passwordInput, 'newpassword');
      await user.type(confirmPasswordInput, 'differentpassword');

      const confirmButton = screen.getByRole('button', { name: /alterar senha/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/as senhas não coincidem/i)).toBeInTheDocument();
      });

      expect(mockOnConfirmReset).not.toHaveBeenCalled();
    });

    it('calls onConfirmReset with correct data', async () => {
      const user = userEvent.setup();
      mockOnRequestReset.mockResolvedValue(undefined);

      render(
        <PasswordResetForm
          onRequestReset={mockOnRequestReset}
          onConfirmReset={mockOnConfirmReset}
          onBack={mockOnBack}
          isLoading={false}
        />
      );

      // Navigate to confirm step
      const userIdInput = screen.getByLabelText(/usuário/i);
      await user.type(userIdInput, 'testuser');
      const submitButton = screen.getByRole('button', { name: /enviar código/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Nova Senha' })).toBeInTheDocument();
      });

      // Fill confirm form
      const codeInput = screen.getByLabelText(/código de verificação/i);
      const passwordInput = screen.getByPlaceholderText(/digite sua nova senha/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar nova senha/i);

      await user.clear(codeInput);
      await user.type(codeInput, '123456');
      await user.type(passwordInput, 'newpassword');
      await user.type(confirmPasswordInput, 'newpassword');

      const confirmButton = screen.getByRole('button', { name: /alterar senha/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnConfirmReset).toHaveBeenCalledWith('testuser', '123456', 'newpassword');
      });
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      mockOnRequestReset.mockResolvedValue(undefined);

      render(
        <PasswordResetForm
          onRequestReset={mockOnRequestReset}
          onConfirmReset={mockOnConfirmReset}
          onBack={mockOnBack}
          isLoading={false}
        />
      );

      // Navigate to confirm step
      const userIdInput = screen.getByLabelText(/usuário/i);
      await user.type(userIdInput, 'testuser');
      const submitButton = screen.getByRole('button', { name: /enviar código/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Nova Senha' })).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/digite sua nova senha/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar nova senha/i);

      // Initially password type
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Find and click toggle buttons
      const toggleButtons = screen.getAllByRole('button').filter(button => 
        button.type === 'button' && 
        !button.textContent?.includes('Alterar') && 
        !button.textContent?.includes('Voltar')
      );

      // Toggle new password visibility
      await user.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Toggle confirm password visibility
      await user.click(toggleButtons[1]);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  it('has proper O Boticário brand styling when form is valid', async () => {
    const user = userEvent.setup();
    render(
      <PasswordResetForm
        onRequestReset={mockOnRequestReset}
        onConfirmReset={mockOnConfirmReset}
        onBack={mockOnBack}
        isLoading={false}
      />
    );

    // Fill form to make it valid
    const userIdInput = screen.getByLabelText(/usuário/i);
    await user.type(userIdInput, 'testuser');

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /enviar código/i });
      expect(submitButton).toHaveClass('bg-gradient-to-r', 'from-[#E91E63]', 'to-[#9C27B0]');
    });
  });
});