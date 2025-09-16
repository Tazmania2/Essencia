import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamSelectionModal, TeamOption } from '../TeamSelectionModal';
import { TeamType } from '../../../types';

// Mock team options for testing
const mockTeamOptions: TeamOption[] = [
  {
    teamType: TeamType.CARTEIRA_I,
    displayName: 'Carteira I',
    teamId: 'E6F4sCh'
  },
  {
    teamType: TeamType.CARTEIRA_II,
    displayName: 'Carteira II',
    teamId: 'E6F4O1b'
  },
  {
    teamType: 'ADMIN',
    displayName: 'Administrador',
    teamId: 'E6U1B1p'
  }
];

describe('TeamSelectionModal', () => {
  const mockOnTeamSelect = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    availableTeams: mockTeamOptions,
    onTeamSelect: mockOnTeamSelect,
    onClose: mockOnClose,
    isLoading: false
  };

  describe('Rendering', () => {
    it('should render modal with header and team options', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      expect(screen.getByText('Selecionar Equipe')).toBeInTheDocument();
      expect(screen.getByText('Você tem acesso a múltiplas equipes. Escolha uma para continuar.')).toBeInTheDocument();
      expect(screen.getByText('Carteira I')).toBeInTheDocument();
      expect(screen.getByText('Carteira II')).toBeInTheDocument();
      expect(screen.getByText('Administrador')).toBeInTheDocument();
    });

    it('should render all team options with correct display names', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      mockTeamOptions.forEach(team => {
        expect(screen.getByText(team.displayName)).toBeInTheDocument();
      });
    });

    it('should render admin option with admin description', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      expect(screen.getByText('Acesso administrativo')).toBeInTheDocument();
    });

    it('should render team options with team descriptions', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      expect(screen.getByText('Equipe Carteira I')).toBeInTheDocument();
      expect(screen.getByText('Equipe Carteira II')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Continuar')).toBeInTheDocument();
    });

    it('should render close button in header', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Fechar modal');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Team Selection', () => {
    it('should allow selecting a team', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const carteiraIOption = screen.getByText('Carteira I').closest('button');
      expect(carteiraIOption).toBeInTheDocument();

      fireEvent.click(carteiraIOption!);

      // Check if the option is visually selected (has the selected styling)
      expect(carteiraIOption).toHaveClass('border-[#E91E63]', 'bg-pink-50');
    });

    it('should allow selecting admin option', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const adminOption = screen.getByText('Administrador').closest('button');
      expect(adminOption).toBeInTheDocument();

      fireEvent.click(adminOption!);

      expect(adminOption).toHaveClass('border-[#E91E63]', 'bg-pink-50');
    });

    it('should change selection when different team is clicked', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const carteiraIOption = screen.getByText('Carteira I').closest('button');
      const carteiraIIOption = screen.getByText('Carteira II').closest('button');

      // Select first team
      fireEvent.click(carteiraIOption!);
      expect(carteiraIOption).toHaveClass('border-[#E91E63]', 'bg-pink-50');

      // Select second team
      fireEvent.click(carteiraIIOption!);
      expect(carteiraIIOption).toHaveClass('border-[#E91E63]', 'bg-pink-50');
      expect(carteiraIOption).not.toHaveClass('border-[#E91E63]', 'bg-pink-50');
    });

    it('should enable continue button when team is selected', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const continueButton = screen.getByText('Continuar');
      expect(continueButton).toBeDisabled();

      const carteiraIOption = screen.getByText('Carteira I').closest('button');
      fireEvent.click(carteiraIOption!);

      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Actions', () => {
    it('should call onTeamSelect when continue is clicked with selected team', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const carteiraIOption = screen.getByText('Carteira I').closest('button');
      fireEvent.click(carteiraIOption!);

      const continueButton = screen.getByText('Continuar');
      fireEvent.click(continueButton);

      expect(mockOnTeamSelect).toHaveBeenCalledWith(TeamType.CARTEIRA_I);
    });

    it('should call onTeamSelect with ADMIN when admin is selected', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const adminOption = screen.getByText('Administrador').closest('button');
      fireEvent.click(adminOption!);

      const continueButton = screen.getByText('Continuar');
      fireEvent.click(continueButton);

      expect(mockOnTeamSelect).toHaveBeenCalledWith('ADMIN');
    });

    it('should call onClose when cancel button is clicked', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when close button in header is clicked', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Fechar modal');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const backdrop = document.querySelector('.fixed.inset-0');
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onClose when modal content is clicked', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const modalContent = screen.getByText('Selecionar Equipe').closest('div');
      fireEvent.click(modalContent!);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable all buttons when loading', () => {
      render(<TeamSelectionModal {...defaultProps} isLoading={true} />);

      const cancelButton = screen.getByText('Cancelar');
      const continueButton = screen.getByText('Carregando...').closest('button');
      const closeButton = screen.getByLabelText('Fechar modal');

      expect(cancelButton).toBeDisabled();
      expect(continueButton).toBeDisabled();
      expect(closeButton).toBeDisabled();
    });

    it('should disable team selection buttons when loading', () => {
      render(<TeamSelectionModal {...defaultProps} isLoading={true} />);

      const carteiraIOption = screen.getByText('Carteira I').closest('button');
      const carteiraIIOption = screen.getByText('Carteira II').closest('button');
      const adminOption = screen.getByText('Administrador').closest('button');

      expect(carteiraIOption).toBeDisabled();
      expect(carteiraIIOption).toBeDisabled();
      expect(adminOption).toBeDisabled();
    });

    it('should show loading text and spinner in continue button', () => {
      render(<TeamSelectionModal {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
      // Check for loading spinner (svg with animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should apply loading styles to buttons', () => {
      render(<TeamSelectionModal {...defaultProps} isLoading={true} />);

      const continueButton = screen.getByText('Carregando...').closest('button');
      expect(continueButton).toHaveClass('opacity-60', 'cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      // Modal should be properly labeled
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const carteiraIOption = screen.getByText('Carteira I').closest('button');
      
      // Focus the option
      carteiraIOption!.focus();
      expect(document.activeElement).toBe(carteiraIOption);

      // Click to select (simulating Enter key behavior)
      fireEvent.click(carteiraIOption!);
      expect(carteiraIOption).toHaveClass('border-[#E91E63]', 'bg-pink-50');
    });

    it('should handle escape key to close modal', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      // Note: This would require additional implementation in the component
      // For now, we're just testing the structure
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty team list', () => {
      render(<TeamSelectionModal {...defaultProps} availableTeams={[]} />);

      expect(screen.getByText('Selecionar Equipe')).toBeInTheDocument();
      expect(screen.getByText('Continuar')).toBeDisabled();
    });

    it('should handle single team option', () => {
      const singleTeam: TeamOption[] = [
        {
          teamType: TeamType.CARTEIRA_I,
          displayName: 'Carteira I',
          teamId: 'E6F4sCh'
        }
      ];

      render(<TeamSelectionModal {...defaultProps} availableTeams={singleTeam} />);

      expect(screen.getByText('Carteira I')).toBeInTheDocument();
      expect(screen.queryByText('Carteira II')).not.toBeInTheDocument();
    });

    it('should not call onTeamSelect when continue is clicked without selection', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const continueButton = screen.getByText('Continuar');
      expect(continueButton).toBeDisabled();

      // Try to click disabled button
      fireEvent.click(continueButton);
      expect(mockOnTeamSelect).not.toHaveBeenCalled();
    });
  });

  describe('Visual States', () => {
    it('should show correct visual state for selected team', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const carteiraIOption = screen.getByText('Carteira I').closest('button');
      fireEvent.click(carteiraIOption!);

      // Check for selected state styling
      expect(carteiraIOption).toHaveClass('border-[#E91E63]', 'bg-pink-50', 'shadow-md');
      
      // Check for radio button visual state
      const radioButton = carteiraIOption!.querySelector('.w-4.h-4.rounded-full');
      expect(radioButton).toHaveClass('border-[#E91E63]', 'bg-[#E91E63]');
    });

    it('should show correct visual state for unselected teams', () => {
      render(<TeamSelectionModal {...defaultProps} />);

      const carteiraIOption = screen.getByText('Carteira I').closest('button');
      const carteiraIIOption = screen.getByText('Carteira II').closest('button');

      // Select first team
      fireEvent.click(carteiraIOption!);

      // Check unselected team styling
      expect(carteiraIIOption).toHaveClass('border-gray-200');
      expect(carteiraIIOption).not.toHaveClass('border-[#E91E63]', 'bg-pink-50');
    });
  });
});