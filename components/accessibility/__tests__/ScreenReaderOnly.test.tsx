import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScreenReaderOnly } from '../ScreenReaderOnly';

describe('ScreenReaderOnly', () => {
  it('renders children with screen reader only classes', () => {
    render(
      <ScreenReaderOnly>
        Screen reader content
      </ScreenReaderOnly>
    );

    const element = screen.getByText('Screen reader content');
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass('sr-only');
  });

  it('renders with custom element type', () => {
    render(
      <ScreenReaderOnly as="h2">
        Heading content
      </ScreenReaderOnly>
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Heading content');
  });

  it('applies custom className', () => {
    render(
      <ScreenReaderOnly className="custom-class">
        Content
      </ScreenReaderOnly>
    );

    const element = screen.getByText('Content');
    expect(element).toHaveClass('custom-class');
  });

  it('uses span as default element', () => {
    render(
      <ScreenReaderOnly>
        Default element
      </ScreenReaderOnly>
    );

    const element = screen.getByText('Default element');
    expect(element.tagName).toBe('SPAN');
  });

  it('has proper accessibility classes', () => {
    render(
      <ScreenReaderOnly>
        Accessible content
      </ScreenReaderOnly>
    );

    const element = screen.getByText('Accessible content');
    expect(element).toHaveClass(
      'sr-only',
      'absolute',
      'w-px',
      'h-px',
      'p-0',
      '-m-px',
      'overflow-hidden',
      'whitespace-nowrap',
      'border-0'
    );
  });
});