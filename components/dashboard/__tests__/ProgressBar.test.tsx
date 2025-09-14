import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders red color for 0-50% range', () => {
    const { container } = render(<ProgressBar percentage={25} />);
    
    const progressFill = container.querySelector('.bg-red-500');
    expect(progressFill).toBeInTheDocument();
    expect(progressFill).toHaveStyle({ width: '16.665%' }); // 25/50 * 33.33 = 16.665%
  });

  it('renders yellow color for 50-99% range', () => {
    const { container } = render(<ProgressBar percentage={75} />);
    
    const progressFill = container.querySelector('.bg-yellow-500');
    expect(progressFill).toBeInTheDocument();
    expect(progressFill).toHaveStyle({ width: '49.995%' }); // 33.33 + (25/50 * 33.33) = 49.995%
  });

  it('renders green color for exactly 100%', () => {
    const { container } = render(<ProgressBar percentage={100} />);
    
    const progressFill = container.querySelector('.bg-green-500');
    expect(progressFill).toBeInTheDocument();
    expect(progressFill).toHaveStyle({ width: '66.66%' }); // 66.66 + (0/50 * 33.34) = 66.66%
  });

  it('renders green color for 100-150% range', () => {
    const { container } = render(<ProgressBar percentage={125} />);
    
    const progressFill = container.querySelector('.bg-green-500');
    expect(progressFill).toBeInTheDocument();
    expect(progressFill).toHaveStyle({ width: '83.33%' }); // 66.66 + (25/50 * 33.34) = 83.33%
  });

  it('caps visual fill at 100% for percentages over 150%', () => {
    const { container } = render(<ProgressBar percentage={200} />);
    
    const progressFill = container.querySelector('.bg-green-500');
    expect(progressFill).toHaveStyle({ width: '100%' });
  });

  it('shows green color for very high percentages like 1000%', () => {
    const { container } = render(<ProgressBar percentage={1000} />);
    
    const progressFill = container.querySelector('.bg-green-500');
    expect(progressFill).toBeInTheDocument();
    expect(progressFill).toHaveStyle({ width: '100%' });
  });

  it('applies correct height classes', () => {
    const { container: smallContainer } = render(<ProgressBar percentage={50} height="sm" />);
    const { container: mediumContainer } = render(<ProgressBar percentage={50} height="md" />);
    const { container: largeContainer } = render(<ProgressBar percentage={50} height="lg" />);
    
    expect(smallContainer.querySelector('.h-2')).toBeInTheDocument();
    expect(mediumContainer.querySelector('.h-3')).toBeInTheDocument();
    expect(largeContainer.querySelector('.h-4')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ProgressBar percentage={50} className="custom-class" />);
    
    const progressBar = container.querySelector('.custom-class');
    expect(progressBar).toBeInTheDocument();
  });
});