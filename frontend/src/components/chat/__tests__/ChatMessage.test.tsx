import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatMessage from '../ChatMessage';
import { AuthProvider } from '../../../context/AuthContext';

describe('ChatMessage', () => {
  const mockMessage = {
    id: '1',
    content: 'Hello, this is a test message',
    role: 'user' as const,
    timestamp: new Date().toISOString(),
  };

  const renderWithAuth = (ui: React.ReactElement, { providerProps = {}, ...renderOptions } = {}) => {
    return render(
      <AuthProvider>
        {ui}
      </AuthProvider>,
      renderOptions
    );
  };

  it('renders user message correctly', () => {
    renderWithAuth(<ChatMessage message={mockMessage} />);
    
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const,
      content: 'Hello, I am an AI assistant'
    };
    
    renderWithAuth(<ChatMessage message={assistantMessage} />);
    
    expect(screen.getByText('Hello, I am an AI assistant')).toBeInTheDocument();
    expect(screen.getByTestId('assistant-avatar')).toBeInTheDocument();
  });

  it('shows edit form when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    renderWithAuth(<ChatMessage message={mockMessage} onEdit={mockOnEdit} />);
    
    // Show actions
    const moreButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(moreButton);
    
    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit message/i });
    fireEvent.click(editButton);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onEdit when save button is clicked', () => {
    const mockOnEdit = jest.fn();
    renderWithAuth(<ChatMessage message={mockMessage} onEdit={mockOnEdit} />);
    
    // Show actions and click edit
    fireEvent.click(screen.getByRole('button', { name: /actions/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit message/i }));
    
    // Change the message
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Updated message' } });
    
    // Save the changes
    fireEvent.click(screen.getByText('Save'));
    
    expect(mockOnEdit).toHaveBeenCalledWith('1', 'Updated message');
  });

  it('shows delete button when onDelete is provided', () => {
    const mockOnDelete = jest.fn();
    renderWithAuth(<ChatMessage message={mockMessage} onDelete={mockOnDelete} />);
    
    // Show actions
    fireEvent.click(screen.getByRole('button', { name: /actions/i }));
    
    expect(screen.getByRole('button', { name: /delete message/i })).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = jest.fn();
    renderWithAuth(<ChatMessage message={mockMessage} onDelete={mockOnDelete} />);
    
    // Show actions and click delete
    fireEvent.click(screen.getByRole('button', { name: /actions/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete message/i }));
    
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('renders markdown content correctly', () => {
    const markdownMessage = {
      ...mockMessage,
      content: '# Heading\n- List item 1\n- List item 2\n```javascript\nconsole.log("Hello");\n```'
    };
    
    renderWithAuth(<ChatMessage message={markdownMessage} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Heading');
    expect(screen.getByText('List item 1')).toBeInTheDocument();
    expect(screen.getByText('List item 2')).toBeInTheDocument();
  });
});
