import React from 'react';
import { render, screen } from '@testing-library/react';
import { GoalCard } from '../GoalCard';
import { ProgressBar } from '../ProgressBar';

describe('Goal Metrics Integration', () => {
  describe('Special Progress Bar Logic', () => {
    it('renders red progress bar for 0-50% range', () => {
      const { container } = render(
        <GoalCard
          title="Test Goal"
          percentage={25}
          description="Test description"
          emoji="🎯"
          hasBoost={true}
          isBoostActive={false}
        />
      );
      
      // Should have red progress bar
      const progressBar = container.querySelector('.bg-red-500');
      expect(progressBar).toBeInTheDocument();
      
      // Should fill approximately 16.67% of visual bar (25/50 * 33.33)
      expect(progressBar).toHaveStyle({ width: '16.665%' });
    });

    it('renders yellow progress bar for 50-100% range', () => {
      const { container } = render(
        <GoalCard
          title="Test Goal"
          percentage={75}
          description="Test description"
          emoji="🎯"
          hasBoost={true}
          isBoostActive={false}
        />
      );
      
      // Should have yellow progress bar
      const progressBar = container.querySelector('.bg-yellow-500');
      expect(progressBar).toBeInTheDocument();
      
      // Should fill approximately 49.995% of visual bar (33.33 + (25/50 * 33.33))
      expect(progressBar).toHaveStyle({ width: '49.995%' });
    });

    it('renders green progress bar for 100-150% range', () => {
      const { container } = render(
        <GoalCard
          title="Test Goal"
          percentage={125}
          description="Test description"
          emoji="🎯"
          hasBoost={true}
          isBoostActive={false}
        />
      );
      
      // Should have green progress bar
      const progressBar = container.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
      
      // Should fill approximately 83.33% of visual bar (66.66 + (25/50 * 33.34))
      expect(progressBar).toHaveStyle({ width: '83.33%' });
    });

    it('caps progress bar at 100% for percentages over 150%', () => {
      const { container } = render(
        <GoalCard
          title="Test Goal"
          percentage={200}
          description="Test description"
          emoji="🎯"
          hasBoost={true}
          isBoostActive={false}
        />
      );
      
      // Should have green progress bar at 100%
      const progressBar = container.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Boost Indicators', () => {
    it('shows active boost with glow animation', () => {
      render(
        <GoalCard
          title="Test Goal"
          percentage={75}
          description="Test description"
          emoji="🎯"
          hasBoost={true}
          isBoostActive={true}
        />
      );
      
      const boostIndicator = screen.getByText('⚡').parentElement;
      expect(boostIndicator).toHaveClass('bg-boticario-gold');
      expect(boostIndicator).toHaveClass('animate-pulse');
    });

    it('shows inactive boost without glow animation', () => {
      render(
        <GoalCard
          title="Test Goal"
          percentage={75}
          description="Test description"
          emoji="🎯"
          hasBoost={true}
          isBoostActive={false}
        />
      );
      
      const boostIndicator = screen.getByText('⚡').parentElement;
      expect(boostIndicator).toHaveClass('bg-gray-300');
      expect(boostIndicator).not.toHaveClass('animate-pulse');
    });

    it('does not show boost indicator when hasBoost is false', () => {
      render(
        <GoalCard
          title="Test Goal"
          percentage={75}
          description="Test description"
          emoji="🎯"
          hasBoost={false}
        />
      );
      
      expect(screen.queryByText('⚡')).not.toBeInTheDocument();
    });
  });

  describe('Team-Specific Goal Names', () => {
    it('displays correct goal names for different teams', () => {
      // Test different goal combinations
      const goals = [
        { name: 'Atividade', emoji: '🎯' },
        { name: 'Faturamento', emoji: '📈' },
        { name: 'Reais por Ativo', emoji: '💰' },
        { name: 'Multimarcas por Ativo', emoji: '🏪' }
      ];

      goals.forEach(goal => {
        const { unmount } = render(
          <GoalCard
            title={goal.name}
            percentage={75}
            description="Test description"
            emoji={goal.emoji}
            hasBoost={true}
            isBoostActive={false}
          />
        );
        
        expect(screen.getByText(`${goal.emoji} ${goal.name}`)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Progress Bar Edge Cases', () => {
    it('handles exactly 50% correctly', () => {
      const { container } = render(<ProgressBar percentage={50} />);
      
      // At exactly 50%, should be red and fill 33.33% of bar
      const progressBar = container.querySelector('.bg-red-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '33.33%' });
    });

    it('handles exactly 100% correctly', () => {
      const { container } = render(<ProgressBar percentage={100} />);
      
      // At exactly 100%, should be yellow and fill 66.66% of bar
      const progressBar = container.querySelector('.bg-yellow-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '66.66%' });
    });

    it('handles exactly 150% correctly', () => {
      const { container } = render(<ProgressBar percentage={150} />);
      
      // At exactly 150%, should be green and fill 100% of bar
      const progressBar = container.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('handles 0% correctly', () => {
      const { container } = render(<ProgressBar percentage={0} />);
      
      // At 0%, should be red and fill 0% of bar
      const progressBar = container.querySelector('.bg-red-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '0%' });
    });
  });

  describe('Accordion Functionality', () => {
    it('maintains existing accordion functionality', () => {
      // This is tested in the main PlayerDashboard test
      // Just verify the structure is maintained
      render(
        <GoalCard
          title="Test Goal"
          percentage={75}
          description="Test description with details"
          emoji="🎯"
          hasBoost={true}
          isBoostActive={false}
        />
      );
      
      expect(screen.getByText('Test description with details')).toBeInTheDocument();
    });
  });
});