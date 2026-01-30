import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@/components/ThemeProvider';

// Mock next-themes since it doesn't work well in JSDOM
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ThemeProvider', () => {
  it('should render children', () => {
    const TestComponent = () => <div>Hello Theme</div>;

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByText('Hello Theme')).toBeInTheDocument();
  });

  it('should wrap children with theme provider', () => {
    render(
      <ThemeProvider>
        <div data-testid="wrapped-content">Theme Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('wrapped-content')).toBeInTheDocument();
    expect(screen.getByText('Theme Content')).toBeInTheDocument();
  });
});