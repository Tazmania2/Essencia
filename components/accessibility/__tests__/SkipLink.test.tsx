import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkipLink } from '../SkipLink';

describe('SkipLink', () => {
  it('renders with correct href and content', () => {
    render(
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
    );

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
    expect(link).toHaveTextContent('Skip to main content');
  });

  it('is hidden by default but visible on focus', () => {
    render(
      <SkipLink href="#content">
        Skip link
      </SkipLink>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('sr-only');
    expect(link).toHaveClass('focus:not-sr-only');
  });

  it('has proper focus styles', () => {
    render(
      <SkipLink href="#content">
        Skip link
      </SkipLink>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass(
      'focus:absolute',
      'focus:top-4',
      'focus:left-4',
      'focus:z-50',
      'focus:px-4',
      'focus:py-2',
      'focus:bg-blue-600',
      'focus:text-white',
      'focus:rounded',
      'focus:shadow-lg',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-blue-500',
      'focus:ring-offset-2'
    );
  });

  it('applies custom className', () => {
    render(
      <SkipLink href="#content" className="custom-skip-link">
        Skip link
      </SkipLink>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('custom-skip-link');
  });

  it('can be focused and activated', () => {
    render(
      <SkipLink href="#test-content">
        Skip to test content
      </SkipLink>
    );

    const link = screen.getByRole('link');
    
    // Focus the link
    fireEvent.focus(link);
    expect(link).toHaveFocus();

    // Click the link
    fireEvent.click(link);
    // Note: In a real browser, this would navigate to the anchor
    expect(link).toHaveAttribute('href', '#test-content');
  });

  it('works with keyboard navigation', () => {
    render(
      <div>
        <SkipLink href="#main">Skip to main</SkipLink>
        <button>Other focusable element</button>
      </div>
    );

    const skipLink = screen.getByRole('link');
    const button = screen.getByRole('button');

    // Tab to skip link
    fireEvent.keyDown(document.body, { key: 'Tab' });
    expect(skipLink).toHaveFocus();

    // Enter should activate the link
    fireEvent.keyDown(skipLink, { key: 'Enter' });
    expect(skipLink).toHaveAttribute('href', '#main');
  });
});