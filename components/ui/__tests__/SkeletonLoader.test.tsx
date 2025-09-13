import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkeletonLoader, SkeletonCard, SkeletonDashboard } from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders with default props', () => {
    render(<SkeletonLoader />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('bg-gray-200', 'rounded', 'animate-pulse');
  });

  it('applies custom width and height', () => {
    render(<SkeletonLoader width="200px" height="50px" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveStyle({
      width: '200px',
      height: '50px',
    });
  });

  it('applies numeric width and height', () => {
    render(<SkeletonLoader width={100} height={25} />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveStyle({
      width: '100px',
      height: '25px',
    });
  });

  it('renders rounded skeleton', () => {
    render(<SkeletonLoader rounded />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('disables animation when animate is false', () => {
    render(<SkeletonLoader animate={false} />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).not.toHaveClass('animate-pulse');
  });

  it('applies custom className', () => {
    render(<SkeletonLoader className="custom-class" />);
    
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('SkeletonCard', () => {
  it('renders with default props', () => {
    render(<SkeletonCard />);
    
    const card = screen.getByRole('generic');
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg', 'p-6');
  });

  it('renders with avatar when showAvatar is true', () => {
    render(<SkeletonCard showAvatar />);
    
    const card = screen.getByRole('generic');
    expect(card).toBeInTheDocument();
    
    // Should have avatar skeleton elements
    const skeletons = card.querySelectorAll('.bg-gray-200');
    expect(skeletons.length).toBeGreaterThan(3); // Avatar + name + subtitle + lines
  });

  it('renders custom number of lines', () => {
    render(<SkeletonCard lines={5} />);
    
    const card = screen.getByRole('generic');
    const skeletons = card.querySelectorAll('.bg-gray-200');
    expect(skeletons).toHaveLength(5);
  });

  it('applies custom className', () => {
    render(<SkeletonCard className="custom-card-class" />);
    
    const card = screen.getByRole('generic');
    expect(card).toHaveClass('custom-card-class');
  });
});

describe('SkeletonDashboard', () => {
  it('renders dashboard skeleton structure', () => {
    render(<SkeletonDashboard />);
    
    const dashboard = screen.getByTestId('skeleton-dashboard');
    expect(dashboard).toHaveClass('space-y-6');
  });

  it('applies custom className', () => {
    render(<SkeletonDashboard className="custom-dashboard-class" />);
    
    const dashboard = screen.getByTestId('skeleton-dashboard');
    expect(dashboard).toHaveClass('custom-dashboard-class');
  });

  it('contains multiple skeleton sections', () => {
    render(<SkeletonDashboard />);
    
    const dashboard = screen.getByTestId('skeleton-dashboard') || document.querySelector('.space-y-6');
    
    // Should have header, points card, cycle info, and goals sections
    expect(dashboard).toBeInTheDocument();
    if (dashboard) {
      const sections = dashboard.children;
      expect(sections.length).toBeGreaterThan(3);
    }
  });
});