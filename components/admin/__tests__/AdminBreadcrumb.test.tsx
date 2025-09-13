import React from 'react';
import { render, screen } from '../../../__tests__/test-utils';
import { AdminBreadcrumb } from '../AdminBreadcrumb';

describe('AdminBreadcrumb', () => {
  it('renders nothing when no items provided', () => {
    const { container } = render(<AdminBreadcrumb items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders home/dashboard link', () => {
    const items = [
      { label: 'Players' }
    ];

    render(<AdminBreadcrumb items={items} />);

    const homeLink = screen.getByRole('link');
    expect(homeLink).toHaveAttribute('href', '/admin');
  });

  it('renders breadcrumb items with links', () => {
    const items = [
      { label: 'Players', href: '/admin/players' },
      { label: 'Details', href: '/admin/players/123' }
    ];

    render(<AdminBreadcrumb items={items} />);

    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    
    const playersLink = screen.getByText('Players').closest('a');
    expect(playersLink).toHaveAttribute('href', '/admin/players');
  });

  it('renders active breadcrumb item without link', () => {
    const items = [
      { label: 'Players', href: '/admin/players' },
      { label: 'Details', isActive: true }
    ];

    render(<AdminBreadcrumb items={items} />);

    const activeItem = screen.getByText('Details');
    expect(activeItem).not.toBeInstanceOf(HTMLAnchorElement);
    expect(activeItem).toHaveClass('text-boticario-pink');
    expect(activeItem).toHaveAttribute('aria-current', 'page');
  });

  it('renders separators between items', () => {
    const items = [
      { label: 'Players', href: '/admin/players' },
      { label: 'Details' }
    ];

    render(<AdminBreadcrumb items={items} />);

    // Should have separators (SVG chevron icons)
    const separators = document.querySelectorAll('svg');
    expect(separators.length).toBeGreaterThan(1); // Home icon + separators
  });

  it('applies correct styling to non-active items', () => {
    const items = [
      { label: 'Players', href: '/admin/players' },
      { label: 'Details' }
    ];

    render(<AdminBreadcrumb items={items} />);

    const playersLink = screen.getByText('Players');
    expect(playersLink).toHaveClass('text-sm', 'font-medium', 'text-gray-500', 'hover:text-boticario-pink');
    
    const detailsSpan = screen.getByText('Details');
    expect(detailsSpan).toHaveClass('text-sm', 'font-medium', 'text-gray-900');
  });

  it('renders home icon with correct accessibility', () => {
    const items = [
      { label: 'Players' }
    ];

    render(<AdminBreadcrumb items={items} />);

    const homeIcon = screen.getByText('Dashboard');
    expect(homeIcon).toHaveClass('sr-only');
  });

  it('has correct navigation role and aria-label', () => {
    const items = [
      { label: 'Players' }
    ];

    render(<AdminBreadcrumb items={items} />);

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toBeInTheDocument();
  });

  it('handles items without href correctly', () => {
    const items = [
      { label: 'Players' },
      { label: 'Details' }
    ];

    render(<AdminBreadcrumb items={items} />);

    const playersSpan = screen.getByText('Players');
    const detailsSpan = screen.getByText('Details');
    
    expect(playersSpan).not.toBeInstanceOf(HTMLAnchorElement);
    expect(detailsSpan).not.toBeInstanceOf(HTMLAnchorElement);
  });

  it('applies hover effects to links', () => {
    const items = [
      { label: 'Players', href: '/admin/players' }
    ];

    render(<AdminBreadcrumb items={items} />);

    const allLinks = screen.getAllByRole('link');
    expect(allLinks[0]).toHaveClass('text-gray-500', 'hover:text-boticario-pink'); // Home link
    
    const playersLink = screen.getByText('Players');
    expect(playersLink).toHaveClass('text-gray-500', 'hover:text-boticario-pink');
  });

  it('renders multiple items correctly', () => {
    const items = [
      { label: 'Players', href: '/admin/players' },
      { label: 'Team A', href: '/admin/players/team-a' },
      { label: 'Player Details', isActive: true }
    ];

    render(<AdminBreadcrumb items={items} />);

    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Player Details')).toBeInTheDocument();
    
    // Check that active item has correct styling
    const activeItem = screen.getByText('Player Details');
    expect(activeItem).toHaveClass('text-boticario-pink');
  });
});