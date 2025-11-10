import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge Component', () => {
  it('renders with "not_started" status', () => {
    render(<StatusBadge status="not_started" />);
    expect(screen.getByText('Prepare')).toBeInTheDocument();
  });

  it('renders with "ready" status', () => {
    render(<StatusBadge status="ready" />);
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('renders with "completed" status', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders with "approved" status', () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders with "rejected" status', () => {
    render(<StatusBadge status="rejected" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('handles case insensitive status', () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders default for unknown status', () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('renders NA for empty status', () => {
    render(<StatusBadge status="" />);
    expect(screen.getByText('NA')).toBeInTheDocument();
  });

  it('applies correct CSS classes for status', () => {
    const { container } = render(<StatusBadge status="completed" />);
    const badge = container.querySelector('.badge');
    expect(badge?.className).toContain('border-success');
    expect(badge?.className).toContain('bg-light-success');
    expect(badge?.className).toContain('text-success');
  });
});
