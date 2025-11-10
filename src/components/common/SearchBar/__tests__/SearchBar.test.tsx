import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../SearchBar';

describe('SearchBar Component', () => {
  it('renders with placeholder', () => {
    const mockOnChange = jest.fn();
    render(<SearchBar value="" onChange={mockOnChange} placeholder="Search..." />);

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('displays current value', () => {
    const mockOnChange = jest.fn();
    render(<SearchBar value="test query" onChange={mockOnChange} />);

    const input = screen.getByDisplayValue('test query');
    expect(input).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const mockOnChange = jest.fn();
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('renders search button with icon', () => {
    const mockOnChange = jest.fn();
    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('uses default placeholder when not provided', () => {
    const mockOnChange = jest.fn();
    render(<SearchBar value="" onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });
});
