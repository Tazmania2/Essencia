import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminSectionHeader } from '../AdminSectionHeader';

describe('AdminSectionHeader', () => {
  it('renders title correctly', () => {
    render(<AdminSectionHeader title="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Title');
  });

  it('renders description when provided', () => {
    render(
      <AdminSectionHeader 
        title="Test Title" 
        description="Test description" 
      />
    );
    
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<AdminSectionHeader title="Test Title" />);
    
    // Should not have a paragraph element for description
    expect(screen.queryByText(/Test description/)).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const testIcon = (
      <svg data-testid="test-icon" className="w-6 h-6">
        <path d="test" />
      </svg>
    );

    render(
      <AdminSectionHeader 
        title="Test Title" 
        icon={testIcon}
      />
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    
    // Check if icon is in the correct container
    const iconContainer = screen.getByTestId('test-icon').closest('div');
    expect(iconContainer).toHaveClass('w-12', 'h-12', 'bg-gradient-to-r', 'from-boticario-pink', 'to-boticario-purple');
  });

  it('does not render icon container when icon not provided', () => {
    render(<AdminSectionHeader title="Test Title" />);
    
    // Should not have the icon container
    const iconContainer = document.querySelector('.w-12.h-12.bg-gradient-to-r');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    const testActions = (
      <button data-testid="test-action">Test Action</button>
    );

    render(
      <AdminSectionHeader 
        title="Test Title" 
        actions={testActions}
      />
    );
    
    expect(screen.getByTestId('test-action')).toBeInTheDocument();
  });

  it('does not render actions container when actions not provided', () => {
    render(<AdminSectionHeader title="Test Title" />);
    
    // Should not have the actions container
    const actionsContainer = document.querySelector('.flex.items-center.space-x-3');
    expect(actionsContainer).not.toBeInTheDocument();
  });

  it('renders all props together correctly', () => {
    const testIcon = (
      <svg data-testid="test-icon" className="w-6 h-6">
        <path d="test" />
      </svg>
    );

    const testActions = (
      <div data-testid="test-actions">
        <button>Action 1</button>
        <button>Action 2</button>
      </div>
    );

    render(
      <AdminSectionHeader 
        title="Complete Title"
        description="Complete description"
        icon={testIcon}
        actions={testActions}
      />
    );
    
    expect(screen.getByText('Complete Title')).toBeInTheDocument();
    expect(screen.getByText('Complete description')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByTestId('test-actions')).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    render(<AdminSectionHeader title="Test Title" />);
    
    const container = screen.getByText('Test Title').closest('.bg-white');
    expect(container).toHaveClass('bg-white', 'rounded-2xl', 'shadow-xl', 'p-6', 'mb-6');
  });

  it('has correct layout structure', () => {
    render(<AdminSectionHeader title="Test Title" />);
    
    // Check for flex layout - the outer container has justify-between
    const outerContainer = screen.getByText('Test Title').closest('.bg-white');
    const flexContainer = outerContainer?.querySelector('.flex.items-center.justify-between');
    expect(flexContainer).toBeInTheDocument();
  });

  it('applies correct text styling', () => {
    render(
      <AdminSectionHeader 
        title="Test Title" 
        description="Test description" 
      />
    );
    
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass('text-2xl', 'font-bold', 'text-gray-900');
    
    const description = screen.getByText('Test description');
    expect(description).toHaveClass('text-gray-600', 'mt-1');
  });

  it('icon container has correct gradient styling', () => {
    const testIcon = (
      <svg data-testid="test-icon" className="w-6 h-6">
        <path d="test" />
      </svg>
    );

    render(
      <AdminSectionHeader 
        title="Test Title" 
        icon={testIcon}
      />
    );
    
    const iconContainer = screen.getByTestId('test-icon').closest('div');
    expect(iconContainer).toHaveClass(
      'w-12', 
      'h-12', 
      'bg-gradient-to-r', 
      'from-boticario-pink', 
      'to-boticario-purple', 
      'rounded-xl', 
      'flex', 
      'items-center', 
      'justify-center', 
      'text-white'
    );
  });

  it('actions container has correct spacing', () => {
    const testActions = (
      <button data-testid="test-action">Test Action</button>
    );

    render(
      <AdminSectionHeader 
        title="Test Title" 
        actions={testActions}
      />
    );
    
    const actionsContainer = screen.getByTestId('test-action').closest('div');
    expect(actionsContainer).toHaveClass('flex', 'items-center', 'space-x-3');
  });
});